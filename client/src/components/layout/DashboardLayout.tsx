import React, { useState, useEffect } from 'react';
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
import { api } from '../../lib/api.js';

import { useAuthStore } from '../../stores/authStore.js';
import { API_BASE_URL } from '../../lib/constants.js';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuthStore();
  // Activate MQTT listeners for notifications, calls, presence & fetch notifications
  useMQTT();
  useNotifications();
  const { incomingCall, activeCall, acceptCall, rejectCall } = useCall();

  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isNewStoryOpen, setIsNewStoryOpen] = useState(false);

  // Heartbeat & active presence ping so friend accounts see immediate online status
  useEffect(() => {
    if (!user?.id) return;

    // Mark online immediately on mount
    api.post('/users/presence').catch(() => {});

    // Periodic heartbeat every 20 seconds while user is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        api.post('/users/presence').catch(() => {});
      }
    }, 20 * 1000);

    // Immediately refresh presence when tab regains focus/visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        api.post('/users/presence').catch(() => {});
      }
    };

    const handleUnload = () => {
      // Immediate offline notification on tab/window close or navigation away
      if (user?.id && navigator.sendBeacon) {
        const beaconUrl = `${API_BASE_URL}/users/presence/offline?userId=${encodeURIComponent(user.id)}`;
        navigator.sendBeacon(beaconUrl);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [user?.id]);



  return (
    <div className="flex min-h-screen bg-[#171A1C] text-[#D9D0B8] font-sans antialiased selection:bg-[#496D6B] selection:text-[#D9D0B8]">
      {/* Persistent Left Sidebar (Desktop) */}
      <Sidebar onOpenNewPost={() => setIsNewPostOpen(true)} />


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Unified sticky container for Header + MobileNav to prevent any safe-area gaps or layout alignment leaks */}
        <div className="sticky top-0 z-20 w-full flex flex-col">
          <Header
            onOpenNewPost={() => setIsNewPostOpen(true)}
            onOpenNewStory={() => setIsNewStoryOpen(true)}
          />
          <MobileNav />
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-12 lg:pb-8">
          <Outlet />
        </main>
      </div>


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
