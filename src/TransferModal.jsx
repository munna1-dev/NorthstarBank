import React, { useState } from './config';

export default function TransferModal({ token, onTransferComplete }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('${API_BASE_URL}/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ${token}'
        },
        body: JSON.stringify({ 
          recipientAccountNumber: recipient, 
          amount: parseFloat(amount) 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transfer failed');

      setSuccess('Transfer successful!');
      setAmount('');
      setRecipient('');
      if (onTransferComplete) onTransferComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleTransfer} className="p-4 bg-white rounded shadow-md max-w-md mx-auto my-4">
      <h3 className="text-lg font-bold mb-3 text-gray-800">Make a Transfer</h3>
      {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}
      {success && <p className="text-green-500 mb-2 text-sm">{success}</p>}
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Recipient Account #</label>
        <input 
          type="text" 
          value={recipient} 
          onChange={(e) => setRecipient(e.target.value)} 
          className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500" 
          placeholder="Enter account number"
          required 
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
        <input 
          type="number" 
          step="0.01"
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500" 
          placeholder="0.00"
          required 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Send Funds'}
      </button>
    </form>
  );
}
