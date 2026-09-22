import React, { useState } from 'react';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';

export default function App() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <LoginForm onLoginSuccess={(data) => setSession(data)} />;
  }

  return (
    <Dashboard 
      token={session.token} 
      user={session.user} 
      onLogout={() => setSession(null)} 
    />
  );
}
