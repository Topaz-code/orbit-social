import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { MobileNav } from './MobileNav.js';
import { useMQTT } from '../../hooks/useMQTT.js';
import { useCall } from '../../hooks/useCall.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { IncomingCallModal } from '../calls/IncomingCallModal.js';
import { ActiveCallView } from '../calls/ActiveCallView.js';
import { PostComposerModal } from '../feed/PostComposerModal.js';
import { StoryUploadModal } from '../stories/StoryUploadModal.js';

export const DashboardLayout: React.FC = () => {
  // Activate MQTT listeners for notifications, calls, presence & fetch notifications
  useMQTT();
  useNotifications();
  const { incomingCall, activeCall, acceptCall, rejectCall } = useCall();

  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isNewStoryOpen, setIsNewStoryOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Persistent Left Sidebar (Desktop) */}
      <Sidebar onOpenNewPost={() => setIsNewPostOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <Header
          onOpenNewPost={() => setIsNewPostOpen(true)}
          onOpenNewStory={() => setIsNewStoryOpen(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals for Quick Post & Story */}
      <PostComposerModal open={isNewPostOpen} onOpenChange={setIsNewPostOpen} />
      <StoryUploadModal open={isNewStoryOpen} onOpenChange={setIsNewStoryOpen} />

      {/* WebRTC Calls Overlay Modals */}
      {incomingCall && (
        <IncomingCallModal
          caller={incomingCall.caller}
          type={incomingCall.type}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {activeCall && <ActiveCallView />}
    </div>
  );
};
