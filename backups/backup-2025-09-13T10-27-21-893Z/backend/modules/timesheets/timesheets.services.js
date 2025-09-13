const Timesheet = require('../../models/Timesheet');
const User = require('../../models/User');
const Client = require('../../models/Client');
const Booking = require('../../models/Booking');
const { sendEmail } = require('../email/email.services.js');

let timesheetLockSettings = {
  lockDay: 1, 
  lockHour: 10, 
  lockMinute: 0,
  enabled: true
};

const checkTimesheetLock = (user, date) => {
  if (user.role === 'manager' || user.role === 'admin' || user.role === 'superuser') {
    return true;
  }
  
  if (!timesheetLockSettings.enabled) {
    return true;
  }
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  if ((currentDay > timesheetLockSettings.lockDay) || 
      (currentDay === timesheetLockSettings.lockDay && 
       (currentHour > timesheetLockSettings.lockHour || 
        (currentHour === timesheetLockSettings.lockHour && currentMinute >= timesheetLockSettings.lockMinute)))) {
    
    const timesheetDate = new Date(date);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    if (timesheetDate < startOfWeek) {
      return false;
    }
  }
  
  return true;
};

const updateTimesheet = async (timesheetId, user, updateData) => {
  const { date, clockIn, clockOut } = updateData;
  
  let timesheet = await Timesheet.findById(timesheetId);
  
  if (!timesheet) {
    throw new Error('Timesheet not found');
  }
  
  if (
    timesheet.user.toString() !== user.id && 
    user.role !== 'manager' && 
    user.role !== 'admin' &&
    user.role !== 'superuser'
  ) {
    throw new Error('Not authorized to update this timesheet');
  }
  
  if (date) timesheet.date = date;
  if (clockIn) timesheet.clockIn = clockIn;
  if (clockOut) timesheet.clockOut = clockOut;
  
  if (updateData.notes !== undefined) timesheet.notes = updateData.notes;
  
  const isManager = user.role === 'manager' || user.role === 'admin' || user.role === 'superuser';
  
  if (isManager) {
    if (updateData.status) timesheet.status = updateData.status;
    if (updateData.needsReview !== undefined) timesheet.needsReview = updateData.needsReview;
    
    if (updateData.breakDuration !== undefined) {
      timesheet.breakDuration = parseInt(updateData.breakDuration);
    }
    
    if (updateData.totalHours !== undefined) {
      timesheet.totalHours = parseFloat(updateData.totalHours);
      timesheet.duration = timesheet.totalHours * 60;
    }
  }
  
  if (clockIn && clockOut && updateData.totalHours === undefined) {
    const clockInTime = new Date(clockIn);
    const clockOutTime = new Date(clockOut);
    
    const shiftDurationMinutes = (clockOutTime - clockInTime) / (1000 * 60);
    
    let breakDuration;
    if (updateData.breakDuration !== undefined && isManager) {
      breakDuration = parseInt(updateData.breakDuration);
    } else {
      breakDuration = calculateBreakDuration(clockInTime, clockOutTime);
    }
    
    const finalDurationMinutes = shiftDurationMinutes - breakDuration;
    
    timesheet.duration = finalDurationMinutes;
    timesheet.totalHours = finalDurationMinutes / 60;
    
    timesheet.breakDuration = breakDuration;
  }
  
  if (updateData.editReason) {
    if (!timesheet.editHistory) {
      timesheet.editHistory = [];
    }
    
    timesheet.editHistory.push({
      editedBy: user.id,
      editedAt: new Date(),
      reason: updateData.editReason,
      changes: {
        date: updateData.date ? 'Updated' : undefined,
        clockIn: updateData.clockIn ? 'Updated' : undefined,
        clockOut: updateData.clockOut ? 'Updated' : undefined,
        notes: updateData.notes !== undefined ? 'Updated' : undefined,
        status: updateData.status ? 'Updated' : undefined,
        breakDuration: updateData.breakDuration !== undefined ? 'Updated' : undefined,
        totalHours: updateData.totalHours !== undefined ? 'Updated' : undefined
      }
    });
  }
  
  await timesheet.save();
  
  return timesheet;
};

const clockIn = async (userId, { clockInTime, notes, location }) => {
  const now = new Date(clockInTime);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const existingTimesheet = await Timesheet.findOne({
    user: userId,
    date: { $gte: startOfDay, $lt: endOfDay },
    status: { $in: ['pending', 'approved'] },
    clockOut: null
  });

  if (existingTimesheet) {
    throw new Error('User has an active timesheet that has not been clocked out');
  }

  const newTimesheet = new Timesheet({
    user: userId,
    date: now,
    clockIn: now,
    notes,
    location
  });

  await newTimesheet.save();
  return newTimesheet;
};

const clockOut = async (userId, { clockOutTime, notes }) => {
  const now = new Date(clockOutTime);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const timesheet = await Timesheet.findOne({
    user: userId,
    date: { $gte: startOfDay, $lt: endOfDay },
    clockOut: null
  });

  if (!timesheet) {
    throw new Error('No active timesheet found for today to clock out');
  }

  timesheet.clockOut = now;
  if (notes) {
    timesheet.notes = timesheet.notes ? `${timesheet.notes}\n${notes}` : notes;
  }

  const clockInTime = new Date(timesheet.clockIn);
  const shiftDurationMinutes = (now - clockInTime) / (1000 * 60);

  const breakDuration = calculateBreakDuration(clockInTime, now);
  const finalDurationMinutes = shiftDurationMinutes - breakDuration;

  timesheet.duration = finalDurationMinutes;
  timesheet.totalHours = finalDurationMinutes / 60;
  timesheet.breakDuration = breakDuration;

  await timesheet.save();
  return timesheet;
};

const getCurrentStatus = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const timesheet = await Timesheet.findOne({
    user: userId,
    date: { $gte: startOfDay, $lt: endOfDay },
    clockOut: null
  }).sort({ clockIn: -1 });

  if (timesheet) {
    return {
      status: 'clocked_in',
      clockInTime: timesheet.clockIn,
      timesheetId: timesheet._id
    };
  } else {
    return { status: 'clocked_out' };
  }
};

const bulkUpload = async (file, userId) => {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const results = [];

  for (const row of data) {
    const { 'User ID': userId, 'Clock In': clockIn, 'Clock Out': clockOut, Notes, Date: date } = row;

    if (!userId || !clockIn || !clockOut || !date) {
      results.push({ userId, status: 'error', message: 'Missing required fields' });
      continue;
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        results.push({ userId, status: 'error', message: 'User not found' });
        continue;
      }

      const clockInTime = new Date(date + ' ' + clockIn);
      const clockOutTime = new Date(date + ' ' + clockOut);

      const shiftDurationMinutes = (clockOutTime - clockInTime) / (1000 * 60);
      const breakDuration = calculateBreakDuration(clockInTime, clockOutTime);
      const finalDurationMinutes = shiftDurationMinutes - breakDuration;

      const timesheet = new Timesheet({
        user: userId,
        date: clockInTime,
        clockIn: clockInTime,
        clockOut: clockOutTime,
        notes: Notes,
        duration: finalDurationMinutes,
        totalHours: finalDurationMinutes / 60,
        breakDuration,
        status: 'approved' 
      });

      await timesheet.save();
      results.push({ userId, status: 'success' });

    } catch (error) {
      results.push({ userId, status: 'error', message: error.message });
    }
  }

  return results;
};

const getLockSettings = () => {
  return timesheetLockSettings;
};

const updateLockSettings = (settings) => {
  timesheetLockSettings = { ...timesheetLockSettings, ...settings };
  return timesheetLockSettings;
};

const overrideTimesheet = async (timesheetId, userId) => {
  const timesheet = await Timesheet.findById(timesheetId);

  if (!timesheet) {
    throw new Error('Timesheet not found');
  }

  const user = await User.findById(userId);

  if (!user || (user.role !== 'admin' && user.role !== 'superuser')) {
    throw new Error('Not authorized to override timesheet lock');
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  timesheet.override = {
    overriddenBy: userId,
    overriddenAt: new Date(),
    previousLockState: { ...timesheetLockSettings }
  };

  await timesheet.save();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Timesheet Lock Overridden',
    text: `The timesheet for ${timesheet.date.toDateString()} has been unlocked outside of the normal schedule.`
  };

  await sendEmail(mailOptions);

  return timesheet;
};

const getClientApprovalTimesheets = async (clientId) => {
  try {
    // Find timesheets that belong to staff assigned to this client and are pending approval
    const timesheets = await Timesheet.find({
      client: clientId,
      status: { $in: ['pending', 'submitted'] }
    })
    .populate('staff', 'firstName lastName email')
    .populate('client', 'name')
    .populate('booking', 'title')
    .sort({ date: -1 });

    return {
      pending: timesheets,
      approved: [],
      rejected: []
    };
  } catch (error) {
    console.error('Error fetching client approval timesheets:', error);
    throw error;
  }
};

const clientApproveTimesheet = async (timesheetId, clientId, approvalData) => {
  try {
    const { status, rejectionReason } = approvalData;
    
    // Find the timesheet and verify it belongs to this client
    const timesheet = await Timesheet.findOne({
      _id: timesheetId,
      client: clientId
    }).populate('staff', 'firstName lastName email');

    if (!timesheet) {
      throw new Error('Timesheet not found or access denied');
    }

    // Update timesheet status
    timesheet.status = status;
    timesheet.approvedBy = clientId;
    timesheet.approvedAt = new Date();
    
    if (status === 'rejected' && rejectionReason) {
      timesheet.rejectionReason = rejectionReason;
    }

    await timesheet.save();

    // Send notification to staff member about approval/rejection
    const User = require('../../models/User');
    const client = await User.findById(clientId);
    
    const mailOptions = {
      to: timesheet.staff.email,
      subject: `Timesheet ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      text: `Your timesheet for ${timesheet.date.toDateString()} has been ${status} by ${client.firstName} ${client.lastName}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`
    };

    await sendEmail(mailOptions);

    return timesheet;
  } catch (error) {
    console.error('Error approving timesheet:', error);
    throw error;
  }
};

module.exports = {
    checkTimesheetLock,
    updateTimesheet,
    clockIn,
    clockOut,
    getCurrentStatus,
    bulkUpload,
    getLockSettings,
    updateLockSettings,
    overrideTimesheet,
    getClientApprovalTimesheets,
    clientApproveTimesheet
};