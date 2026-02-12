import { useState } from 'react';
import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Radio, Users, Lock, Sparkles, Clock, Video } from 'lucide-react';

const LIVE_STREAMS = [
  {
    id: 1,
    domme: 'MistressViper',
    title: 'Live Q&A Session',
    viewers: 156,
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=225&fit=crop',
    tags: ['Q&A', 'Interactive'],
  },
  {
    id: 2,
    domme: 'GoddessLilith',
    title: 'Dungeon Tour Live',
    viewers: 89,
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=225&fit=crop',
    tags: ['Tour', 'Educational'],
  },
];

const UPCOMING = [
  {
    id: 1,
    domme: 'DominaAlexis',
    title: 'Bondage Workshop',
    scheduled: 'Today, 8:00 PM EST',
  },
  {
    id: 2,
    domme: 'MistressVelvet',
    title: 'Ask Me Anything',
    scheduled: 'Tomorrow, 3:00 PM EST',
  },
];

const FEATURES = [
  {
    icon: Video,
    title: 'Private Shows',
    description: 'Book one-on-one cam sessions with your favorite dommes',
  },
  {
    icon: Users,
    title: 'Group Sessions',
    description: 'Join group shows and interact with multiple viewers',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description: 'All streams are encrypted and completely confidential',
  },
];

function LiveStreamCard({ stream }) {
  return (
    <Card hover className="overflow-hidden p-0">
      <div className="relative aspect-video">
        <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2">
          <Badge variant="error" size="sm" dot dotColor="#ef4444">LIVE</Badge>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
          <Users className="w-3 h-3" />
          {stream.viewers}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold mb-1">{stream.title}</h3>
        <p className="text-red-600 text-sm mb-2">{stream.domme}</p>
        <div className="flex flex-wrap gap-1">
          {stream.tags.map((tag) => (
            <span key={tag} className="text-xs bg-[#1f1f1f] text-gray-400 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function LiveCams() {
  return (
    <Layout>
      <SEO title="Live Cams - DommeDirectory" description="Live cam sessions with professional dommes." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="error" className="mb-4" dot dotColor="#ef4444">Now Live</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Live{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Cams
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Connect with professional dommes in real-time. Private shows and group sessions available.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="text-center">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Live Now */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Radio className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Live Now</h2>
          </div>
          
          {LIVE_STREAMS.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {LIVE_STREAMS.map((stream) => (
                <LiveStreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No Live Streams</h3>
              <p className="text-gray-400 text-sm">Check back later or view upcoming sessions below.</p>
            </Card>
          )}
        </div>

        {/* Upcoming */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-white">Upcoming</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            {UPCOMING.map((session) => (
              <Card key={session.id} className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{session.title}</h3>
                  <p className="text-red-600 text-sm">{session.domme}</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.scheduled}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/20 via-red-900/10 to-dark-300 border border-gray-700 p-8 lg:p-12 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/10 rounded-full blur-2xl" />
          
          <div className="relative">
            <Sparkles className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Go Live?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Dommes can broadcast live to their audience, host private shows, and earn tips. 
              Live streaming available for Pro and Elite members.
            </p>
            <Button size="lg">Start Streaming</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
