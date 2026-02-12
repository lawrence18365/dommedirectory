import { useState } from 'react';
import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Search, MessageCircle, FileText, Shield, CreditCard, User, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', icon: User },
  { id: 'account', name: 'Account & Billing', icon: CreditCard },
  { id: 'safety', name: 'Safety & Privacy', icon: Shield },
  { id: 'general', name: 'General', icon: FileText },
];

const FAQS = [
  {
    category: 'getting-started',
    question: 'How do I create a profile?',
    answer: 'Click "Sign Up" in the top right corner, choose whether you\'re a Domme or Client, and follow the verification steps.',
  },
  {
    category: 'getting-started',
    question: 'What is verification?',
    answer: 'Verification confirms your identity through government ID and optional video call. Verified profiles get a badge and priority placement.',
  },
  {
    category: 'account',
    question: 'How do I upgrade my subscription?',
    answer: 'Go to Settings → Billing and select your desired plan. Changes take effect immediately.',
  },
  {
    category: 'account',
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit cards, PayPal, and cryptocurrency for maximum privacy.',
  },
  {
    category: 'safety',
    question: 'How is my privacy protected?',
    answer: 'We use bank-level encryption, never share your data with third parties, and offer discreet billing descriptors.',
  },
  {
    category: 'safety',
    question: 'How do I report someone?',
    answer: 'Click the "Report" button on any profile or message, or email support@dommedirectory.com.',
  },
  {
    category: 'general',
    question: 'Is this platform legal?',
    answer: 'Yes. We are a directory service connecting consenting adults. We comply with all applicable laws and strictly prohibit illegal activities.',
  },
  {
    category: 'general',
    question: 'How do I delete my account?',
    answer: 'Go to Settings → Account → Delete Account. This action is permanent and cannot be undone.',
  },
];

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-white font-medium">{question}</span>
        <ChevronDown className={`w-5 h-5 text-red-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <p className="text-gray-400 text-sm pb-4">{answer}</p>
      )}
    </div>
  );
}

export default function Help() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [openFaq, setOpenFaq] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.filter(faq => 
    faq.category === activeCategory &&
    (searchQuery === '' || faq.question.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout>
      <SEO title="Help Center - DommeDirectory" description="Find answers to common questions." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="primary" className="mb-4">Support</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Help{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Center
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Find answers to common questions about using DommeDirectory.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
            />
          </div>
        </div>

        {/* Contact CTA */}
        <Card className="max-w-2xl mx-auto mb-12 text-center p-6">
          <MessageCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-gray-400 mb-4">Our support team is available 24/7</p>
          <Button href="mailto:support@dommedirectory.com">Contact Support</Button>
        </Card>

        {/* Categories & FAQs */}
        <div className="max-w-3xl mx-auto">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <Card padding="lg">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No results found. Try a different search.</p>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
