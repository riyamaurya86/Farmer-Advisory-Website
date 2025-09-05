import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { recordsAPI } from '../services/apiService';

const Records = () => {
  const { translate } = useLanguage();
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState('checking');
  const [formData, setFormData] = useState({
    cropName: '',
    plantingDate: '',
    expectedHarvest: '',
    notes: ''
  });

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    setIsLoading(true);
    try {
      // Test backend connection
      const healthCheck = await recordsAPI.health();
      setDbStatus(healthCheck.success ? 'connected' : 'error');

      // Load records
      await loadRecords();
    } catch (error) {
      console.error('Backend connection error:', error);
      setDbStatus('error');
      await loadRecordsFromLocalStorage(); // Fallback to localStorage
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      const response = await recordsAPI.getAll();
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error loading records from backend:', error);
      await loadRecordsFromLocalStorage();
    }
  };

  const loadRecordsFromLocalStorage = async () => {
    try {
      const savedRecords = localStorage.getItem('farmingRecords');
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }
    } catch (error) {
      console.error('Error loading records from localStorage:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cropName || !formData.plantingDate) {
      alert('Please fill in required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await recordsAPI.create(formData);
      setRecords(prev => [response.data, ...prev]);

      setFormData({
        cropName: '',
        plantingDate: '',
        expectedHarvest: '',
        notes: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setIsLoading(true);
      try {
        await recordsAPI.delete(id);
        setRecords(prev => prev.filter(record =>
          record.id !== id && record._id !== id
        ));
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getDbStatusIcon = () => {
    switch (dbStatus) {
      case 'connected':
        return <i className="fas fa-database text-success" title="Connected to MongoDB Atlas"></i>;
      case 'local':
        return <i className="fas fa-hdd text-warning" title="Using local storage"></i>;
      case 'error':
        return <i className="fas fa-exclamation-triangle text-danger" title="Database error"></i>;
      default:
        return <i className="fas fa-spinner fa-spin text-muted" title="Connecting..."></i>;
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h2>
              <i className="fas fa-clipboard-list"></i>
              {translate('farmingRecords')}
              <span className="ms-2">{getDbStatusIcon()}</span>
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary"
              disabled={isLoading}
            >
              <i className="fas fa-plus"></i>
              {translate('addRecord')}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="p-4 bg-light">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">{translate('cropName')} *</label>
                  <input
                    type="text"
                    name="cropName"
                    value={formData.cropName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{translate('plantingDate')} *</label>
                  <input
                    type="date"
                    name="plantingDate"
                    value={formData.plantingDate}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{translate('expectedHarvest')}</label>
                  <input
                    type="date"
                    name="expectedHarvest"
                    value={formData.expectedHarvest}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{translate('notes')}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      {translate('save')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  {translate('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-4">
          {isLoading && records.length === 0 ? (
            <div className="text-center p-4">
              <i className="fas fa-spinner fa-spin fa-3x mb-3"></i>
              <p>Loading records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center text-muted p-4">
              <i className="fas fa-seedling fa-3x mb-3"></i>
              <p>No farming records yet. Add your first record to get started!</p>
            </div>
          ) : (
            <div className="records-grid">
              {records.map((record) => (
                <div key={record.id || record._id} className="record-card">
                  <div className="record-header">
                    <h4>{record.cropName}</h4>
                    <button
                      onClick={() => deleteRecord(record.id || record._id)}
                      className="btn-delete"
                      title="Delete record"
                      disabled={isLoading}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>

                  <div className="record-details">
                    <div className="record-item">
                      <i className="fas fa-calendar-plus"></i>
                      <span>Planted: {formatDate(record.plantingDate)}</span>
                    </div>

                    {record.expectedHarvest && (
                      <div className="record-item">
                        <i className="fas fa-calendar-check"></i>
                        <span>Expected Harvest: {formatDate(record.expectedHarvest)}</span>
                      </div>
                    )}

                    {record.notes && (
                      <div className="record-notes">
                        <i className="fas fa-sticky-note"></i>
                        <p>{record.notes}</p>
                      </div>
                    )}

                    <div className="record-meta">
                      <small>Added: {formatDate(record.createdAt)}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Records;
