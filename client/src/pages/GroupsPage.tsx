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
    <div className="max-w-5xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 mb-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Micro Groups
            </h1>
            <p className="text-xs text-slate-400">
              Close circles limited to a strict maximum of {MAX_GROUP_MEMBERS} members.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
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
