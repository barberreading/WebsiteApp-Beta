import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaDownload, FaFilePdf } from 'react-icons/fa';
import moment from 'moment';

const PublicDocument = () => {
  const { accessKey } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/staff-documents/public/${accessKey}`);
        setDocument(res.data);
        setLoading(false);
      } catch (err) {
        setError('Document not found or access has expired');
        setLoading(false);
      }
    };

    if (accessKey) {
      fetchDocument();
    }
  }, [accessKey]);

  const downloadDocument = async () => {
    try {
      const res = await axios.get(`/staff-documents/public/download/${accessKey}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download document');
    }
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Staff Document</h4>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading document...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : document ? (
            <div>
              <div className="text-center mb-4">
                <FaFilePdf size={64} className="text-danger mb-3" />
                <h3>{document.title}</h3>
                <p className="text-muted">
                  {document.documentType === 'DBS' ? 'DBS Check' : 
                   document.documentType === 'AgencyProfile' ? 'Agency Profile' : 
                   document.documentType}
                </p>
              </div>
              
              <div className="mb-4">
                <p><strong>Staff Member:</strong> {document.staffName}</p>
                <p><strong>Issued Date:</strong> {moment(document.issuedDate).format('DD/MM/YYYY')}</p>
                {document.expiryDate && (
                  <p>
                    <strong>Valid Until:</strong> {moment(document.expiryDate).format('DD/MM/YYYY')}
                    {moment().isAfter(moment(document.expiryDate)) && (
                      <span className="text-danger ms-2">(Expired)</span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="text-center">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={downloadDocument}
                  className="px-4"
                >
                  <FaDownload className="me-2" /> Download Document
                </Button>
              </div>
            </div>
          ) : (
            <Alert variant="warning">Document not found</Alert>
          )}
        </Card.Body>
        <Card.Footer className="text-center text-muted">
          <small>This is a secure document link. Please do not share this link with others.</small>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default PublicDocument;