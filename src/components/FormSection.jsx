// src/components/FormSection.jsx

import React from 'react';

const FormSection = ({ title, children }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4 pb-2 border-b">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
