import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Send, ShoppingCart, Users, TrendingUp, Clock, 
  CheckCircle, XCircle, Eye, MousePointer, RefreshCw,
  Play, ChevronDown, ChevronUp, Filter, Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Layout from '../components/Layout';
import { API_URL } from '../api/client';


const EmailMarketingPage = () => {
  const [stats, setStats] = useState(null);
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [emailQueue, setEmailQueue] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [subscribers, setSubscribers] = useState({ subscribers: [], total: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [processingQueue, setProcessingQueue] = useState(false);

  // Manual email form
  const [manualEmail, setManualEmail] = useState({
    template_id: '',
    recipient_email: '',
    recipient_name: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, cartsRes, queueRes, templatesRes, subscribersRes] = await Promise.all([
        fetch(`${API_URL}/api/email/stats?days=30`),
        fetch(`${API_URL}/api/email/abandoned-carts?limit=50`),
        fetch(`${API_URL}/api/email/queue?limit=50`),
        fetch(`${API_URL}/api/email/templates`),
        fetch(`${API_URL}/api/email/subscribers?limit=50`)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (cartsRes.ok) {
        const data = await cartsRes.json();
        setAbandonedCarts(data.carts || []);
      }
      if (queueRes.ok) {
        const data = await queueRes.json();
        setEmailQueue(data.emails || []);
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }
      if (subscribersRes.ok) {
        setSubscribers(await subscribersRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const startAbandonedCartFlow = async (cartId) => {
    try {
      const res = await fetch(`${API_URL}/api/email/abandoned-cart/${cartId}/start-flow`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Verlaten winkelwagen flow gestart!');
        fetchData();
      }
    } catch (error) {
      alert('Fout bij starten flow');
    }
  };

  const processQueue = async () => {
    setProcessingQueue(true);
    try {
      const res = await fetch(`${API_URL}/api/email/process-queue`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.emails_sent} e-mails verzonden!`);
        fetchData();
      }
    } catch (error) {
      alert('Fout bij verwerken queue');
    }
    setProcessingQueue(false);
  };

  const sendManualEmail = async () => {
    if (!manualEmail.template_id || !manualEmail.recipient_email) {
      alert('Vul template en e-mailadres in');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualEmail)
      });
      if (res.ok) {
        alert('E-mail verzonden!');
        setManualEmail({ template_id: '', recipient_email: '', recipient_name: '' });
        fetchData();
      } else {
        alert('Fout bij verzenden e-mail');
      }
    } catch (error) {
      alert('Fout bij verzenden e-mail');
    }
    setSendingEmail(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      queued: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      abandoned: 'bg-orange-100 text-orange-800',
      recovered: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800'
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getFlowBadge = (flow) => {
    const colors = {
      abandoned_cart: 'bg-orange-100 text-orange-800',
      welcome: 'bg-blue-100 text-blue-800',
      post_purchase: 'bg-green-100 text-green-800',
      winback: 'bg-purple-100 text-purple-800'
    };
    const labels = {
      abandoned_cart: 'Verlaten Wagen',
      welcome: 'Welkom',
      post_purchase: 'Na Aankoop',
      winback: 'Win-back'
    };
    return (
      <Badge className={colors[flow] || 'bg-gray-100 text-gray-800'}>
        {labels[flow] || flow}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">E-mail Marketing</h1>
              <p className="text-gray-600 mt-1">Beheer je e-mail flows en bekijk statistieken</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={fetchData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Vernieuwen
              </Button>
              <Button 
                onClick={processQueue}
                disabled={processingQueue}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                {processingQueue ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Verwerk Queue
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">E-mails Verzonden</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total_sent}</p>
                      <p className="text-xs text-gray-400 mt-1">Laatste {stats.period_days} dagen</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Open Rate</p>
                      <p className="text-3xl font-bold text-green-600">{stats.open_rate}%</p>
                      <p className="text-xs text-gray-400 mt-1">{stats.total_opened} geopend</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Click Rate</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.click_rate}%</p>
                      <p className="text-xs text-gray-400 mt-1">{stats.total_clicked} geklikt</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <MousePointer className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Cart Recovery</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {stats.abandoned_carts?.recovery_rate || 0}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {stats.abandoned_carts?.recovered || 0} / {stats.abandoned_carts?.total || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <ShoppingCart className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overzicht', icon: TrendingUp },
              { id: 'abandoned', label: 'Verlaten Wagens', icon: ShoppingCart },
              { id: 'queue', label: 'E-mail Queue', icon: Clock },
              { id: 'send', label: 'Handmatig Versturen', icon: Send },
              { id: 'subscribers', label: 'Abonnees', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Flow Statistieken</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.flow_stats || {}).map(([flow, flowStats]) => (
                    <Card key={flow}>
                      <CardContent className="p-4">
                        {getFlowBadge(flow)}
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Verzonden</span>
                            <span className="font-medium">{flowStats.sent}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Geopend</span>
                            <span className="font-medium text-green-600">{flowStats.opened}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Geklikt</span>
                            <span className="font-medium text-blue-600">{flowStats.clicked}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <h2 className="text-xl font-semibold mt-8">E-mail Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{template.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                          </div>
                          {getFlowBadge(template.flow)}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span>Sequence: {template.sequence}</span>
                          <span>Delay: {template.delay_hours}u</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Abandoned Carts Tab */}
            {activeTab === 'abandoned' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Verlaten Winkelwagens</h2>
                  <p className="text-sm text-gray-500">{abandonedCarts.length} wagens</p>
                </div>
                
                {abandonedCarts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Geen verlaten winkelwagens gevonden</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klant</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bedrag</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actie</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {abandonedCarts.map(cart => (
                          <tr key={cart.cart_id}>
                            <td className="px-4 py-4 text-sm text-gray-900">{cart.customer_name || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{cart.customer_email}</td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              €{cart.total_amount?.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">{formatDate(cart.created_at)}</td>
                            <td className="px-4 py-4">{getStatusBadge(cart.status)}</td>
                            <td className="px-4 py-4">
                              {cart.status === 'abandoned' && !cart.flow_started && (
                                <Button
                                  size="sm"
                                  onClick={() => startAbandonedCartFlow(cart.cart_id)}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Start Flow
                                </Button>
                              )}
                              {cart.flow_started && (
                                <Badge className="bg-blue-100 text-blue-800">Flow actief</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Email Queue Tab */}
            {activeTab === 'queue' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">E-mail Queue</h2>
                  <p className="text-sm text-gray-500">{emailQueue.length} e-mails</p>
                </div>

                {emailQueue.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Geen e-mails in de queue</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ontvanger</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flow</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versturen Op</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opens</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {emailQueue.map(email => (
                          <tr key={email.email_id}>
                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-gray-900">{email.template_name}</p>
                              <p className="text-xs text-gray-500">{email.subject}</p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm text-gray-900">{email.recipient_name || '-'}</p>
                              <p className="text-xs text-gray-500">{email.recipient_email}</p>
                            </td>
                            <td className="px-4 py-4">{getFlowBadge(email.flow)}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{formatDate(email.send_at)}</td>
                            <td className="px-4 py-4">{getStatusBadge(email.status)}</td>
                            <td className="px-4 py-4">
                              <span className={`text-sm ${email.open_count > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                {email.open_count}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-sm ${email.click_count > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                {email.click_count}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Manual Send Tab */}
            {activeTab === 'send' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold mb-6">Handmatig E-mail Versturen</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template
                    </label>
                    <select
                      value={manualEmail.template_id}
                      onChange={(e) => setManualEmail({ ...manualEmail, template_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Selecteer een template...</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.flow})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mailadres ontvanger
                    </label>
                    <input
                      type="email"
                      value={manualEmail.recipient_email}
                      onChange={(e) => setManualEmail({ ...manualEmail, recipient_email: e.target.value })}
                      placeholder="voorbeeld@email.nl"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam ontvanger (optioneel)
                    </label>
                    <input
                      type="text"
                      value={manualEmail.recipient_name}
                      onChange={(e) => setManualEmail({ ...manualEmail, recipient_name: e.target.value })}
                      placeholder="Jan Jansen"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <Button
                    onClick={sendManualEmail}
                    disabled={sendingEmail}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-3"
                  >
                    {sendingEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verzenden...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Verstuur E-mail
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Subscribers Tab */}
            {activeTab === 'subscribers' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">E-mail Abonnees</h2>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-green-100 text-green-800">
                      {subscribers.active} actief
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-800">
                      {subscribers.total} totaal
                    </Badge>
                  </div>
                </div>

                {subscribers.subscribers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Geen abonnees gevonden</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aangemeld</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bron</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {subscribers.subscribers.map((sub, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-4 text-sm text-gray-900">{sub.name || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{sub.email}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{formatDate(sub.subscribed_at)}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{sub.source || '-'}</td>
                            <td className="px-4 py-4">{getStatusBadge(sub.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmailMarketingPage;
