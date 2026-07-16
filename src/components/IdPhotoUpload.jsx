import React, { useRef } from 'react';
import styles from '../styles';

const MAX_SIZE_MB = 4;

// Component for uploading and displaying an ID photo (National ID/Driver's License).
// The photo is stored as a base64 data URL in the relevant form's state.
const IdPhotoUpload = ({ label, value, onChange }) => {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Image is too large. The maximum allowed size is ${MAX_SIZE_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.formGroup}>
      <label style={styles.formLabel}>{label}</label>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={value}
            alt={label}
            style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button type="button" onClick={() => inputRef.current.click()} style={{ ...styles.btnSecondary, padding: '6px 12px', fontSize: '13px' }}>
              Change Photo
            </button>
            <button type="button" onClick={() => onChange('')} style={{ ...styles.btnDanger, padding: '6px 12px', fontSize: '13px' }}>
              Remove
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            style={{
              ...styles.formInput, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', border: '1px dashed #cbd5e1', width: '100%'
            }}
          >
            📷 Upload ID Photo
          </button>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default IdPhotoUpload;
