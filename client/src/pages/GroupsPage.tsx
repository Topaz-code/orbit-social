import React, { useState } from 'react';
import { useGroups } from '../hooks/useGroups.js';
import { GroupCard } from '../components/groups/GroupCard.js';
import { CreateGroupModal } from '../components/groups/CreateGroupModal.js';
import { Button } from '../components/ui/button.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { Users, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.js';
import { MAX_GROUP_MEMBERS } from '../lib/constants.js';
import { Group } from '../types/index.js';

export const GroupsPage: React.FC = () => {
  const { myGroups, discoverGroups, isLoading, joinGroup, isJoining } = useGroups();
  const [activeTab, setActiveTab] = useState('my-groups');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto min-w-0 text-[#D9D0B8]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 mb-6 rounded-3xl bg-[#202A2D] border border-[#3A4B4D] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2B3940] border border-[#3A4B4D] text-[#D0A56A] shadow-inner">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#D9D0B8] tracking-tight">
              Micro Groups
            </h1>
            <p className="text-xs text-[#A8AAA0]">
              Close circles limited to a strict maximum of {MAX_GROUP_MEMBERS} members.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779] rounded-[10px] font-semibold">
          <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
          <span>Create Group</span>
        </Button>
      </div>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="discover">Discover ({discoverGroups.length})</TabsTrigger>
        </TabsList>

        {/* My Groups Tab */}
        <TabsContent value="my-groups">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading groups...</div>
          ) : myGroups.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-indigo-600" />}
              title="You haven't joined any groups"
              description="Join a group from Discover or create a private circle with up to 10 friends."
              actionLabel="Explore Groups"
              onAction={() => setActiveTab('discover')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myGroups.map((group: Group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Discover Groups Tab */}
        <TabsContent value="discover">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Searching groups...</div>
          ) : discoverGroups.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-indigo-600" />}
              title="No public groups to discover"
              description="You are currently a member of all available public groups."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {discoverGroups.map((group: Group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={joinGroup}
                  isJoining={isJoining}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateGroupModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};
