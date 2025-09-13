import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaFileUpload, FaDownload, FaEdit, FaTrash, FaEye, FaBell } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import { toast } from 'react-toastify';

const StaffHR = () => {
  const { currentUser: user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  
  // Form states
  const [documentForm, setDocumentForm] = useState({
    staffId: '',
    documentType: 'DBS',
    title: '',
    issuedDate: new Date(),
    expiryDate: null,
    reminderDate: null,
    isPublic: false,
    notes: '',
    file: null
  });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch staff list (for managers)
  useEffect(() => {
    if (['manager', 'superuser', 'admin'].includes(user.role)) {
      fetchStaffList();
    } else {
      // For staff members, set themselves as selected
      setSelectedStaff(user);
      fetchDocuments(user._id);
    }
  }, [user]);
  
  const fetchStaffList = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/users?role=staff');
      setStaff(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch staff list');
      setLoading(false);
    }
  };
  
  const fetchDocuments = async (staffId) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/staff-documents?staffId=${staffId}`);
      setDocuments(Array.isArray(res.data) ? res.data : (res.data.documents || []));
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch documents');
      setLoading(false);
    }
  };
  
  const handleStaffSelect = (staff) => {
    // Initialize documentSharing if it doesn't exist
    if (!staff.documentSharing) {
      staff.documentSharing = {
        shareProfile: true,
        shareDBS: true,
        shareRiskAssessment: true
      };
    }
    setSelectedStaff(staff);
    fetchDocuments(staff._id);
  };
  
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('staffId', documentForm.staffId || selectedStaff._id);
      formData.append('documentType', documentForm.documentType);
      formData.append('title', documentForm.title);
      formData.append('issuedDate', documentForm.issuedDate);
      if (documentForm.expiryDate) formData.append('expiryDate', documentForm.expiryDate);
      if (documentForm.reminderDate) formData.append('reminderDate', documentForm.reminderDate);
      formData.append('isPublic', documentForm.isPublic);
      formData.append('notes', documentForm.notes);
      formData.append('document', documentForm.file);
      
      await axiosInstance.post('/staff-documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Document uploaded successfully');
      setShowUploadModal(false);
      resetForm();
      fetchDocuments(selectedStaff._id);
      setLoading(false);
    } catch (err) {
      setError('Failed to upload document');
      setLoading(false);
    }
  };
  
  const handleEditDocument = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await axiosInstance.put(`/staff-documents/${selectedDocument._id}`, {
        title: documentForm.title,
        documentType: documentForm.documentType,
        issuedDate: documentForm.issuedDate,
        expiryDate: documentForm.expiryDate,
        reminderDate: documentForm.reminderDate,
        isPublic: documentForm.isPublic,
        notes: documentForm.notes
      });
      
      setSuccess('Document updated successfully');
      setShowEditModal(false);
      fetchDocuments(selectedStaff._id);
      setLoading(false);
    } catch (err) {
      setError('Failed to update document');
      setLoading(false);
    }
  };
  
  const handleDeleteDocument = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.delete(`/staff-documents/${selectedDocument._id}`);
      
      setSuccess('Document deleted successfully');
      setShowDeleteModal(false);
      fetchDocuments(selectedStaff._id);
      setLoading(false);
    } catch (err) {
      setError('Failed to delete document');
      setLoading(false);
    }
  };
  
  const downloadDocument = async (id) => {
    try {
      const res = await axiosInstance.get(`/staff-documents/download/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download document');
    }
  };
  
  const resetForm = () => {
    setDocumentForm({
      staffId: '',
      documentType: 'DBS',
      title: '',
      issuedDate: new Date(),
      expiryDate: null,
      reminderDate: null,
      isPublic: false,
      notes: '',
      file: null
    });
  };
  
  const openEditModal = (document) => {
    setSelectedDocument(document);
    setDocumentForm({
      staffId: document.staff._id,
      documentType: document.documentType,
      title: document.title,
      issuedDate: new Date(document.issuedDate),
      expiryDate: document.expiryDate ? new Date(document.expiryDate) : null,
      reminderDate: document.reminderDate ? new Date(document.reminderDate) : null,
      isPublic: document.isPublic,
      notes: document.notes || '',
      file: null
    });
    setShowEditModal(true);
  };
  
  const openDeleteModal = (document) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  };
  
  const openViewModal = (document) => {
    setSelectedDocument(document);
    setShowViewModal(true);
  };
  
  const getDocumentTypeColor = (type) => {
    switch (type) {
      case 'DBS':
        return 'primary';
      case 'AgencyProfile':
        return 'success';
      case 'Qualification':
        return 'info';
      case 'FirstAid':
        return 'warning';
      case 'Training':
        return 'secondary';
      default:
        return 'dark';
    }
  };
  
  const getDocumentStatus = (document) => {
    if (!document.expiryDate) return null;
    
    const now = moment();
    const expiry = moment(document.expiryDate);
    const diff = expiry.diff(now, 'days');
    
    if (diff < 0) {
      return { text: 'Expired', variant: 'danger' };
    } else if (diff < 30) {
      return { text: 'Expiring Soon', variant: 'warning' };
    } else {
      return { text: 'Valid', variant: 'success' };
    }
  };
  
  const filterDocuments = () => {
    if (activeTab === 'all') return documents;
    
    return documents.filter(doc => doc.documentType === activeTab);
  };
  
  const copyPublicLink = (document) => {
    const link = `${window.location.origin}/public-document/${document.accessKey}`;
    navigator.clipboard.writeText(link);
    setSuccess('Public link copied to clipboard');
  };
  
  return (
    <Container fluid className="mt-4">
      <h2>Staff HR Documents</h2>
      
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
      
      <Row>
        {/* Staff List (for managers) */}
        {['manager', 'superuser', 'admin'].includes(user.role) && (
          <Col md={3}>
            <Card>
              <Card.Header>Staff Members</Card.Header>
              <Card.Body className="p-0">
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <Table hover>
                    <tbody>
                      {staff.map(s => (
                        <tr 
                          key={s._id} 
                          onClick={() => handleStaffSelect(s)}
                          className={selectedStaff && selectedStaff._id === s._id ? 'table-primary' : ''}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{s.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
        
        {/* Documents Section */}
        <Col md={['manager', 'superuser', 'admin'].includes(user.role) ? 9 : 12}>
          {selectedStaff ? (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">HR Documents for {selectedStaff.name}</h5>
                <div>
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    className="me-2" 
                    onClick={() => window.location.href = `/staff-profile/${selectedStaff._id}`}
                  >
                    View Profile
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2" 
                    onClick={() => {
                      const dbsDoc = documents.find(doc => doc.documentType === 'DBS');
                      if (dbsDoc) {
                        window.open(`/staff-documents/download/${dbsDoc._id}`, '_blank');
                      } else {
                        setError('No DBS check found for this staff member');
                      }
                    }}
                  >
                    DBS Check
                  </Button>
                  <Button 
                    variant="outline-warning" 
                    size="sm" 
                    className="me-2" 
                    onClick={() => {
                      const riskDoc = documents.find(doc => doc.documentType === 'Risk Assessment');
                      if (riskDoc) {
                        window.open(`/staff-documents/download/${riskDoc._id}`, '_blank');
                      } else {
                        setError('No risk assessment found for this staff member');
                      }
                    }}
                  >
                    Risk Assessment
                  </Button>
                  {(['manager', 'superuser', 'admin'].includes(user.role)) && (
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="me-2" 
                      onClick={() => {
                        setShowSharingModal(true);
                      }}
                    >
                      Document Sharing
                    </Button>
                  )}
                  {(['manager', 'superuser', 'admin'].includes(user.role) || user._id === selectedStaff._id) && (
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      resetForm();
                      setDocumentForm(prev => ({ ...prev, staffId: selectedStaff._id }));
                      setShowUploadModal(true);
                    }}
                  >
                    <FaFileUpload /> Upload Document
                  </Button>
                )}
                </div>
              </Card.Header>
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-3"
                >
                  <Tab eventKey="all" title="All Documents" />
                  <Tab eventKey="DBS" title="DBS Checks" />
                  <Tab eventKey="AgencyProfile" title="Agency Profiles" />
                  <Tab eventKey="Qualification" title="Qualifications" />
                  <Tab eventKey="FirstAid" title="First Aid" />
                  <Tab eventKey="Training" title="Training" />
                  <Tab eventKey="Other" title="Other" />
                </Tabs>
                
                {loading ? (
                  <div className="text-center py-4">Loading documents...</div>
                ) : filterDocuments().length === 0 ? (
                  <div className="text-center py-4">No documents found</div>
                ) : (
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Issued Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Public</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterDocuments().map(doc => {
                        const status = getDocumentStatus(doc);
                        return (
                          <tr key={doc._id}>
                            <td>{doc.title}</td>
                            <td>
                              <Badge bg={getDocumentTypeColor(doc.documentType)}>
                                {doc.documentType}
                              </Badge>
                            </td>
                            <td>{moment(doc.issuedDate).format('DD/MM/YYYY')}</td>
                            <td>
                              {doc.expiryDate ? moment(doc.expiryDate).format('DD/MM/YYYY') : 'N/A'}
                            </td>
                            <td>
                              {status && (
                                <Badge bg={status.variant}>{status.text}</Badge>
                              )}
                            </td>
                            <td>
                              {doc.isPublic ? (
                                <Badge bg="success" style={{ cursor: 'pointer' }} onClick={() => copyPublicLink(doc)}>
                                  Public (Click to Copy Link)
                                </Badge>
                              ) : (
                                <Badge bg="secondary">Private</Badge>
                              )}
                            </td>
                            <td>
                              <Button variant="info" size="sm" className="me-1" onClick={() => downloadDocument(doc._id)}>
                                <FaDownload />
                              </Button>
                              <Button variant="secondary" size="sm" className="me-1" onClick={() => openViewModal(doc)}>
                                <FaEye />
                              </Button>
                              {(['manager', 'superuser', 'admin'].includes(user.role) || user._id === selectedStaff._id) && (
                                <>
                                  <Button variant="warning" size="sm" className="me-1" onClick={() => openEditModal(doc)}>
                                    <FaEdit />
                                  </Button>
                                  {['manager', 'superuser', 'admin'].includes(user.role) && (
                                    <Button variant="danger" size="sm" onClick={() => openDeleteModal(doc)}>
                                      <FaTrash />
                                    </Button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          ) : (
            <div className="text-center py-4">Select a staff member to view their HR documents</div>
          )}
        </Col>
      </Row>
      
      {/* Upload Document Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUploadDocument}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Document Type</Form.Label>
                  <Form.Select 
                    value={documentForm.documentType}
                    onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })}
                    required
                  >
                    <option value="DBS">DBS Check</option>
                    <option value="AgencyProfile">Agency Profile</option>
                    <option value="Qualification">Qualification</option>
                    <option value="FirstAid">First Aid</option>
                    <option value="Training">Training Certificate</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Document Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={documentForm.title}
                    onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                <Form.Label>Issued Date</Form.Label>
                <Form.Control
                  type="date"
                  value={documentForm.issuedDate ? new Date(documentForm.issuedDate).toISOString().split('T')[0] : ''}
                  // This ensures the date is displayed in dd/mm/yyyy format when viewed
                  onChange={(e) => setDocumentForm({...documentForm, issuedDate: new Date(e.target.value)})}
                  required
                />
              </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date (if applicable)</Form.Label>
                  <Form.Control
                    type="date"
                    value={documentForm.expiryDate ? new Date(documentForm.expiryDate).toISOString().split('T')[0] : ''}
                  // Display format will be dd/mm/yyyy when viewed
                    onChange={(e) => setDocumentForm({...documentForm, expiryDate: e.target.value ? new Date(e.target.value) : null})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Reminder Date (if applicable)</Form.Label>
                  <Form.Control
                    type="date"
                    value={documentForm.reminderDate ? new Date(documentForm.reminderDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setDocumentForm({...documentForm, reminderDate: e.target.value ? new Date(e.target.value) : null})}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Document File</Form.Label>
              <Form.Control 
                type="file" 
                onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files[0] })}
                required
              />
              <Form.Text className="text-muted">
                Accepted formats: PDF, JPEG, PNG, Word documents. Max size: 10MB
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Make this document publicly accessible to clients (for DBS checks and Agency Profiles)"
                checked={documentForm.isPublic}
                onChange={(e) => setDocumentForm({ ...documentForm, isPublic: e.target.checked })}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes (optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={documentForm.notes}
                onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Edit Document Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditDocument}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Document Type</Form.Label>
                  <Form.Select 
                    value={documentForm.documentType}
                    onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })}
                    required
                  >
                    <option value="DBS">DBS Check</option>
                    <option value="AgencyProfile">Agency Profile</option>
                    <option value="Qualification">Qualification</option>
                    <option value="FirstAid">First Aid</option>
                    <option value="Training">Training Certificate</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Document Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={documentForm.title}
                    onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Issued Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={documentForm.issuedDate ? documentForm.issuedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDocumentForm({ ...documentForm, issuedDate: new Date(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date (if applicable)</Form.Label>
                  <Form.Control
                    type="date"
                    value={documentForm.expiryDate ? documentForm.expiryDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value ? new Date(e.target.value) : null })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Reminder Date (if applicable)</Form.Label>
                  <Form.Control
                    type="date"
                    value={documentForm.reminderDate ? documentForm.reminderDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDocumentForm({ ...documentForm, reminderDate: e.target.value ? new Date(e.target.value) : null })}
                    isClearable
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Make this document publicly accessible to clients (for DBS checks and Agency Profiles)"
                checked={documentForm.isPublic}
                onChange={(e) => setDocumentForm({ ...documentForm, isPublic: e.target.checked })}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes (optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={documentForm.notes}
                onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Delete Document Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the document "{selectedDocument?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteDocument} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Document'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* View Document Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Document Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocument && (
            <div>
              <h5>{selectedDocument.title}</h5>
              <p><strong>Type:</strong> {selectedDocument.documentType}</p>
              <p><strong>Issued Date:</strong> {moment(selectedDocument.issuedDate).format('DD/MM/YYYY')}</p>
              <p><strong>Expiry Date:</strong> {selectedDocument.expiryDate ? moment(selectedDocument.expiryDate).format('DD/MM/YYYY') : 'N/A'}</p>
              <p><strong>Reminder Date:</strong> {selectedDocument.reminderDate ? moment(selectedDocument.reminderDate).format('DD/MM/YYYY') : 'N/A'}</p>
              <p><strong>Public Access:</strong> {selectedDocument.isPublic ? 'Yes' : 'No'}</p>
              <p><strong>Uploaded By:</strong> {selectedDocument.uploadedBy?.name || 'Unknown'}</p>
              <p><strong>Uploaded At:</strong> {moment(selectedDocument.createdAt).format('DD/MM/YYYY HH:mm')}</p>
              
              {selectedDocument.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p>{selectedDocument.notes}</p>
                </div>
              )}
              
              {selectedDocument.isPublic && (
                <div className="mt-3">
                  <h6>Public Access Link:</h6>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      value={`${window.location.origin}/public-document/${selectedDocument.accessKey}`} 
                      readOnly 
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => copyPublicLink(selectedDocument)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => downloadDocument(selectedDocument?._id)}>
            Download Document
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Document Sharing Modal */}
      <Modal show={showSharingModal} onHide={() => setShowSharingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Document Sharing Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <p>Select which documents to include in booking confirmation and reminder emails:</p>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                id="shareProfile"
                label="Share staff profile in booking emails"
                checked={selectedStaff?.documentSharing?.shareProfile}
                onChange={async (e) => {
                  try {
                    await axiosInstance.put(`/users/${selectedStaff._id}/document-sharing`, {
                      shareProfile: e.target.checked,
                      shareDBS: selectedStaff?.documentSharing?.shareDBS,
                      shareRiskAssessment: selectedStaff?.documentSharing?.shareRiskAssessment
                    });
                    setSelectedStaff({
                      ...selectedStaff,
                      documentSharing: {
                        ...selectedStaff.documentSharing,
                        shareProfile: e.target.checked
                      }
                    });
                    setSuccess('Document sharing preferences updated');
                  } catch (err) {
                    setError('Failed to update sharing preferences');
                  }
                }}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                id="shareDBS"
                label="Share DBS certificate in booking emails"
                checked={selectedStaff?.documentSharing?.shareDBS}
                onChange={async (e) => {
                  try {
                    await axiosInstance.put(`/users/${selectedStaff._id}/document-sharing`, {
                       shareProfile: selectedStaff?.documentSharing?.shareProfile,
                       shareDBS: e.target.checked,
                      shareRiskAssessment: selectedStaff?.documentSharing?.shareRiskAssessment
                    });
                    setSelectedStaff({
                      ...selectedStaff,
                      documentSharing: {
                        ...selectedStaff.documentSharing,
                        shareDBS: e.target.checked
                      }
                    });
                    setSuccess('Document sharing preferences updated');
                  } catch (err) {
                    setError('Failed to update sharing preferences');
                  }
                }}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                id="shareRiskAssessment"
                label="Share risk assessment in booking emails"
                checked={selectedStaff?.documentSharing?.shareRiskAssessment}
                onChange={async (e) => {
                  try {
                    await axiosInstance.put(`/users/${selectedStaff._id}/document-sharing`, {
                       shareProfile: selectedStaff?.documentSharing?.shareProfile,
                       shareDBS: selectedStaff?.documentSharing?.shareDBS,
                       shareRiskAssessment: e.target.checked
                    });
                    setSelectedStaff({
                      ...selectedStaff,
                      documentSharing: {
                        ...selectedStaff.documentSharing,
                        shareRiskAssessment: e.target.checked
                      }
                    });
                    setSuccess('Document sharing preferences updated');
                  } catch (err) {
                    setError('Failed to update sharing preferences');
                  }
                }}
              />
            </Form.Group>
          </Form>
          
          <div className="d-flex justify-content-end mt-3">
            <Button variant="secondary" onClick={() => setShowSharingModal(false)}>
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StaffHR;