import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Container, Card } from 'react-bootstrap';

const UserGuide = () => {
  const [guideContent, setGuideContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const { data } = await axiosInstance.get('/user-guide');
        setGuideContent(data.content);
      } catch (err) {
        setError('Failed to load user guide. Please try again later.');
        logger.error('Error fetching user guide:', err);
      }
    };

    fetchGuide();
  }, []);

  return (
    <Container className="py-5">
      <h2>User Guide</h2>
      <hr />
      {error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <Card>
          <Card.Body>
            <div dangerouslySetInnerHTML={{ __html: guideContent }} />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default UserGuide;