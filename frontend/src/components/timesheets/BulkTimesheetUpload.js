import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Box, Button, Card, CardContent, CircularProgress, Container, Divider, FormControl, FormControlLabel, FormGroup, Grid, IconButton, Paper, Radio, RadioGroup, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Alert, Switch, Chip } from '@mui/material';
import { CloudUpload, Delete, Edit, CheckCircle, Error, Refresh, GetApp } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const BulkTimesheetUpload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [breakRule, setBreakRule] = useState('default');
  const [customBreakDuration, setCustomBreakDuration] = useState(30);
  const [processedResults, setProcessedResults] = useState([]);
  const [manualEntries, setManualEntries] = useState({});
  const [payrollReport, setPayrollReport] = useState(null);
  const [onlineTimesheets, setOnlineTimesheets] = useState([]);
  const [loadingOnlineTimesheets, setLoadingOnlineTimesheets] = useState(false);
  const [includeOnlineTimesheets, setIncludeOnlineTimesheets] = useState(true);
  const [onlineTimesheetFilter, setOnlineTimesheetFilter] = useState('approved'); // 'all' or 'approved'
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0], // 2 weeks ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // Check if user has permission to access this feature
  const hasPermission = user && (user.role === 'manager' || user.role === 'admin' || user.role === 'superuser');

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setAlert({
        open: true,
        message: 'Please select files to upload',
        severity: 'warning'
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('timesheets', file);
    });

    try {
      const res = await axiosInstance.post('/timesheets/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAlert({
        open: true,
        message: `${res.data.files.length} files uploaded successfully`,
        severity: 'success'
      });
      
      // Store the uploaded file info for processing
      setProcessedResults(res.data.files);
      setFiles([]);
    } catch (err) {
      setAlert({
        open: true,
        message: err.response?.data?.msg || 'Error uploading files',
        severity: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleProcessOCR = async () => {
    if (processedResults.length === 0) {
      setAlert({
        open: true,
        message: 'No files to process',
        severity: 'warning'
      });
      return;
    }

    setProcessing(true);

    // Prepare break rules based on user selection
    const breakRules = {
      useDefault: breakRule === 'default',
      noBreaks: breakRule === 'none',
      customBreakDuration: breakRule === 'custom' ? customBreakDuration : null
    };

    try {
      const res = await axiosInstance.post('/timesheets/process-ocr', {
        files: processedResults,
        breakRules
      });

      setProcessedResults(res.data.results);
      
      setAlert({
        open: true,
        message: 'OCR processing completed',
        severity: 'success'
      });
    } catch (err) {
      setAlert({
        open: true,
        message: err.response?.data?.msg || 'Error processing files',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualEntry = (fileIndex, field, value) => {
    setManualEntries({
      ...manualEntries,
      [fileIndex]: {
        ...(manualEntries[fileIndex] || {}),
        [field]: value
      }
    });
  };

  const handleSaveManualEntry = (fileIndex) => {
    const updatedResults = [...processedResults];
    const fileData = updatedResults[fileIndex];
    
    // Update the file with manual entries
    updatedResults[fileIndex] = {
      ...fileData,
      status: 'processed',
      processingErrors: [],
      extractedData: {
        ...(fileData.extractedData || {}),
        ...manualEntries[fileIndex]
      }
    };
    
    setProcessedResults(updatedResults);
    
    // Clear the manual entries for this file
    const updatedManualEntries = { ...manualEntries };
    delete updatedManualEntries[fileIndex];
    setManualEntries(updatedManualEntries);
    
    setAlert({
      open: true,
      message: 'Manual entry saved successfully',
      severity: 'success'
    });
  };

    // Fetch online timesheets
  const fetchOnlineTimesheets = async () => {
    try {
      setLoadingOnlineTimesheets(true);
      // Build query parameters
      const params = new URLSearchParams();
      if (onlineTimesheetFilter === 'approved') {
        params.append('approvedOnly', 'true');
      }
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);

      const res = await axiosInstance.get(`/timesheets/online?${params.toString()}`);
      setOnlineTimesheets(res.data);
    } catch (err) {
      setAlert({
        open: true,
        message: err.response?.data?.msg || 'Error fetching online timesheets',
        severity: 'error'
      });
    } finally {
      setLoadingOnlineTimesheets(false);
    }
  };

  // Effect to generate payroll report when processed results or online timesheets change
  useEffect(() => {
    if (processedResults.length > 0 || (includeOnlineTimesheets && onlineTimesheets.length > 0)) {
      generatePayrollReport();
    }
  }, [processedResults, manualEntries, onlineTimesheets, includeOnlineTimesheets]);
  
  // Fetch online timesheets when filter changes
  useEffect(() => {
    if (includeOnlineTimesheets) {
      fetchOnlineTimesheets();
    }
  }, [onlineTimesheetFilter, dateRange, includeOnlineTimesheets]);

  const generatePayrollReport = () => {
    // Filter only processed results with valid data
    const validResults = processedResults.filter(
      result => result.status === 'processed' && result.extractedData
    );
    
    if (validResults.length === 0 && (!includeOnlineTimesheets || onlineTimesheets.length === 0)) {
      setAlert({
        open: true,
        message: 'No valid timesheet data to generate report',
        severity: 'warning'
      });
      return;
    }
    
    // Group by staff name
    const staffHours = {};
    const manualVerifications = {};
    const unapprovedTimesheets = {};
    
    // Process paper timesheets
    validResults.forEach(result => {
      const { staffName, hoursWorked } = result.extractedData;
      
      if (!staffHours[staffName]) {
        staffHours[staffName] = 0;
        manualVerifications[staffName] = [];
        unapprovedTimesheets[staffName] = [];
      }
      
      staffHours[staffName] += hoursWorked;
      
      // Track timesheets that required verification
      if (result.requiresVerification) {
        manualVerifications[staffName].push({
          fileName: result.fileName,
          reason: result.verificationReason,
          date: result.extractedData.date,
          type: 'paper'
        });
      }
    });
    
    // Add online timesheets if included
    if (includeOnlineTimesheets && onlineTimesheets.length > 0) {
      onlineTimesheets.forEach(timesheet => {
        const staffName = timesheet.staff.name;
        
        if (!staffHours[staffName]) {
          staffHours[staffName] = 0;
          manualVerifications[staffName] = [];
          unapprovedTimesheets[staffName] = [];
        }
        
        staffHours[staffName] += timesheet.totalHours;
        
        // Track unapproved timesheets
        if (timesheet.status !== 'approved') {
          unapprovedTimesheets[staffName].push({
            id: timesheet._id,
            date: new Date(timesheet.date).toLocaleDateString(),
            hours: timesheet.totalHours,
            status: timesheet.status
          });
        }
        
        // Track overridden timesheets
        if (timesheet.managerOverride) {
          manualVerifications[staffName].push({
            id: timesheet._id,
            reason: 'Manager Override',
            date: new Date(timesheet.date).toLocaleDateString(),
            type: 'online',
            overriddenBy: timesheet.overriddenBy?.name || 'Manager'
          });
        }
      });
    }
    
    // Convert to array for sorting
    const reportData = Object.entries(staffHours).map(([staffName, totalHours]) => ({
      staffName,
      totalHours: parseFloat(totalHours.toFixed(2)),
      manualVerifications: manualVerifications[staffName] || [],
      unapproved: unapprovedTimesheets[staffName] || []
    }));
    
    setPayrollReport(reportData);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {!hasPermission ? (
        <Alert severity="error">
          You do not have permission to access this feature. Only managers and administrators can process timesheets.
        </Alert>
      ) : (
        <>
          <Typography variant="h4" gutterBottom>
            Paper Timesheet Processing
          </Typography>
          
          <Grid container spacing={3}>
            {/* File Upload Section */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Upload Timesheet Files
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <input
                    accept="image/jpeg,image/png,application/pdf"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    multiple
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="raised-button-file">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUpload />}
                      disabled={uploading}
                    >
                      Select Files
                    </Button>
                  </label>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    sx={{ ml: 2 }}
                  >
                    {uploading ? <CircularProgress size={24} /> : 'Upload Files'}
                  </Button>
                </Box>
                
                {files.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>File Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {files.map((file, index) => (
                          <TableRow key={index}>
                            <TableCell>{file.name}</TableCell>
                            <TableCell>{file.type}</TableCell>
                            <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveFile(index)}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
            
            {/* Break Rules Section */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Break Rules
                </Typography>
                
                <FormControl component="fieldset">
                  <RadioGroup
                    name="breakRules"
                    value={breakRule}
                    onChange={(e) => setBreakRule(e.target.value)}
                  >
                    <FormControlLabel
                      value="default"
                      control={<Radio />}
                      label={
                        <Typography>
                          Use default break rules:
                          <ul>
                            <li>Under 6 hours: No break</li>
                            <li>6 to 6.5 hours: 20-minute break</li>
                            <li>Over 6.5 hours: 30-minute break</li>
                          </ul>
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      value="none"
                      control={<Radio />}
                      label="No breaks (use total hours as is)"
                    />
                    <FormControlLabel
                      value="custom"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography>Custom break duration:</Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={customBreakDuration}
                            onChange={(e) => setCustomBreakDuration(parseInt(e.target.value) || 0)}
                            disabled={breakRule !== 'custom'}
                            InputProps={{
                              endAdornment: <Typography variant="body2">minutes</Typography>,
                              inputProps: { min: 0, max: 120 }
                            }}
                            sx={{ ml: 2, width: 100 }}
                          />
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Online Timesheet Options
                </Typography>
                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeOnlineTimesheets}
                        onChange={(e) => setIncludeOnlineTimesheets(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Include online timesheets in payroll report"
                  />
                </FormControl>
                
                {includeOnlineTimesheets && (
                  <Box sx={{ mt: 2 }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        name="online-timesheet-filter"
                        value={onlineTimesheetFilter}
                        onChange={(e) => setOnlineTimesheetFilter(e.target.value)}
                      >
                        <FormControlLabel value="approved" control={<Radio />} label="Approved only" />
                        <FormControlLabel value="all" control={<Radio />} label="All timesheets" />
                      </RadioGroup>
                    </FormControl>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <TextField
                        label="Start Date"
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mr: 2 }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                    
                    {loadingOnlineTimesheets ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2">Loading online timesheets...</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        {onlineTimesheets.length} online timesheets loaded
                      </Typography>
                    )}
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProcessOCR}
                  disabled={processedResults.length === 0 || processing}
                  sx={{ mt: 2, alignSelf: 'flex-start' }}
                >
                  {processing ? <CircularProgress size={24} /> : 'Process Timesheets'}
                </Button>
              </Paper>
            </Grid>
            
            {/* Processing Results Section */}
            {processedResults.length > 0 && (
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Processing Results
                  </Typography>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>File</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Staff</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Hours</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {processedResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.originalName}</TableCell>
                            <TableCell>
                              {result.status === 'processed' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CheckCircle color="success" sx={{ mr: 1 }} />
                                  Processed
                                  {result.requiresVerification && (
                                    <Box 
                                      component="span" 
                                      sx={{ 
                                        ml: 1, 
                                        bgcolor: 'warning.light', 
                                        color: 'warning.contrastText', 
                                        px: 1, 
                                        py: 0.5, 
                                        borderRadius: 1,
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      Requires Verification
                                    </Box>
                                  )}
                                </Box>
                              ) : result.status === 'error' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Error color="error" sx={{ mr: 1 }} />
                                  Error
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CircularProgress size={16} sx={{ mr: 1 }} />
                                  Pending
                                </Box>
                              )}
                              {result.requiresVerification && result.verificationReason && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  Reason: {result.verificationReason}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.status === 'error' ? (
                                <TextField
                                  size="small"
                                  label="Staff Name"
                                  value={manualEntries[index]?.staffName || ''}
                                  onChange={(e) => handleManualEntry(index, 'staffName', e.target.value)}
                                />
                              ) : (
                                result.extractedData?.staffName || 'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              {result.status === 'error' ? (
                                <TextField
                                  size="small"
                                  type="date"
                                  value={manualEntries[index]?.date || new Date().toISOString().split('T')[0]}
                                  onChange={(e) => handleManualEntry(index, 'date', e.target.value)}
                                />
                              ) : (
                                result.extractedData?.date || 'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              {result.status === 'error' ? (
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Hours"
                                  InputProps={{ inputProps: { min: 0, step: 0.25 } }}
                                  value={manualEntries[index]?.hoursWorked || ''}
                                  onChange={(e) => handleManualEntry(index, 'hoursWorked', parseFloat(e.target.value) || 0)}
                                />
                              ) : (
                                result.extractedData?.hoursWorked || 'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              {result.status === 'error' ? (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleSaveManualEntry(index)}
                                  disabled={!manualEntries[index]?.staffName || !manualEntries[index]?.hoursWorked}
                                >
                                  Save
                                </Button>
                              ) : (
                                <IconButton size="small" onClick={() => {
                                  // Set up manual entry with current data
                                  handleManualEntry(index, 'staffName', result.extractedData?.staffName || '');
                                  handleManualEntry(index, 'date', result.extractedData?.date || new Date().toISOString().split('T')[0]);
                                  handleManualEntry(index, 'hoursWorked', result.extractedData?.hoursWorked || 0);
                                  
                                  // Mark as error to enable editing
                                  const updatedResults = [...processedResults];
                                  updatedResults[index] = {
                                    ...result,
                                    status: 'error'
                                  };
                                  setProcessedResults(updatedResults);
                                }}>
                                  <Edit />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={generatePayrollReport}
                    sx={{ mt: 2, alignSelf: 'flex-start' }}
                  >
                    Generate Payroll Report
                  </Button>
                </Paper>
              </Grid>
            )}
            
            {/* Payroll Report Section */}
            {payrollReport && (
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Payroll Report
                      {includeOnlineTimesheets && (
                        <Chip 
                          label={onlineTimesheetFilter === 'approved' ? 'Approved Online Timesheets' : 'All Online Timesheets'} 
                          color="primary" 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<GetApp />}
                      onClick={() => {
                        // Generate CSV data
                        const headers = ['Staff Name', 'Total Hours', 'Verifications'];
                        if (onlineTimesheetFilter === 'all' && includeOnlineTimesheets) {
                          headers.push('Unapproved');
                        }
                        
                        const csvContent = [
                          headers,
                          ...payrollReport.map(row => {
                            const rowData = [row.staffName, row.totalHours.toFixed(2), row.manualVerifications.length];
                            if (onlineTimesheetFilter === 'all' && includeOnlineTimesheets) {
                              rowData.push(row.unapproved.length);
                            }
                            return rowData;
                          }),
                          ['TOTAL', 
                           payrollReport.reduce((sum, row) => sum + row.totalHours, 0).toFixed(2),
                           payrollReport.reduce((sum, row) => sum + (row.manualVerifications?.length || 0), 0),
                           ...(onlineTimesheetFilter === 'all' && includeOnlineTimesheets ? 
                              [payrollReport.reduce((sum, row) => sum + (row.unapproved?.length || 0), 0)] : [])
                          ]
                        ].map(e => e.join(',')).join('\n');
                        
                        // Create download link
                        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', 'payroll_report.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      Download Report
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Staff Name</TableCell>
                          <TableCell>Total Hours</TableCell>
                          <TableCell>Verifications</TableCell>
                          {onlineTimesheetFilter === 'all' && includeOnlineTimesheets && (
                            <TableCell>Unapproved</TableCell>
                          )}
                          <TableCell>Source</TableCell>
                          <TableCell>Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payrollReport.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.staffName}</TableCell>
                            <TableCell>{row.totalHours}</TableCell>
                            <TableCell>
                              {row.manualVerifications && row.manualVerifications.length > 0 ? (
                                <Box>
                                  <Box 
                                    component="span" 
                                    sx={{ 
                                      bgcolor: 'warning.light', 
                                      color: 'warning.contrastText', 
                                      px: 1, 
                                      py: 0.5, 
                                      borderRadius: 1,
                                      fontSize: '0.75rem',
                                      mr: 1
                                    }}
                                  >
                                    {row.manualVerifications.length} Verification{row.manualVerifications.length > 1 ? 's' : ''}
                                  </Box>
                                </Box>
                              ) : (
                                "None"
                              )}
                            </TableCell>
                            {onlineTimesheetFilter === 'all' && includeOnlineTimesheets && (
                              <TableCell>
                                {row.unapproved && row.unapproved.length > 0 ? (
                                  <Chip 
                                    label={row.unapproved.length} 
                                    color="warning" 
                                    size="small" 
                                  />
                                ) : "0"}
                              </TableCell>
                            )}
                            <TableCell>
                              {row.manualVerifications.some(v => v.type === 'paper') && (
                                <Chip label="Paper" size="small" sx={{ mr: 0.5 }} />
                              )}
                              {row.manualVerifications.some(v => v.type === 'online') && (
                                <Chip label="Online" size="small" color="info" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="small" 
                                onClick={() => {
                                  // Show detailed information in a dialog or alert
                                  const verificationDetails = row.manualVerifications.map(v => 
                                    `- ${v.type === 'paper' ? v.fileName : 'Online'}: ${v.reason} (${v.date})${v.overriddenBy ? `, By: ${v.overriddenBy}` : ''}`
                                  ).join('\n');
                                  
                                  const unapprovedDetails = row.unapproved ? row.unapproved.map(u => 
                                    `- Date: ${u.date}, Hours: ${u.hours}, Status: ${u.status}`
                                  ).join('\n') : '';
                                  
                                  alert(`Details for ${row.staffName}:\n\n${verificationDetails}\n\n${unapprovedDetails ? 'Unapproved Timesheets:\n' + unapprovedDetails : ''}`);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            {payrollReport.reduce((sum, row) => sum + row.totalHours, 0).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            {payrollReport.reduce((sum, row) => sum + (row.manualVerifications?.length || 0), 0)} Total Verifications
                          </TableCell>
                          {onlineTimesheetFilter === 'all' && includeOnlineTimesheets && (
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {payrollReport.reduce((sum, row) => sum + (row.unapproved?.length || 0), 0)}
                            </TableCell>
                          )}
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
          
          <Snackbar
            open={alert.open}
            autoHideDuration={6000}
            onClose={handleCloseAlert}
          >
            <Alert onClose={handleCloseAlert} severity={alert.severity}>
              {alert.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Container>
  );
};

export default BulkTimesheetUpload;