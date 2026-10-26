/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ToastContainer } from './components/ui/SharedComponents';
import { WorkspaceApp } from './components/WorkspaceApp';
import { CaseSyncProvider, useCaseSync } from './context/CaseSyncContext';

const CaseSyncRouter: React.FC = () => {
  const { viewMode } = useCaseSync();

  return (
    <>
      {viewMode === 'landing' && <LandingPage />}
      {viewMode === 'login' && <LoginPage />}
      {viewMode === 'workspace' && <WorkspaceApp />}
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <CaseSyncProvider>
      <CaseSyncRouter />
    </CaseSyncProvider>
  );
}
