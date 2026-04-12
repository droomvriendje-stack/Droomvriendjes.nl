import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Mail, MapPin, Clock, Loader2, MessageCircle, Phone, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { trackContactFormSubmit } from '../utils/analytics';
import Layout from '../components/Layout';
import { API_URL } from '../api/client';

// WhatsApp configuration
const WHATSAPP_NUMBER = '31684588815';
const WHATSAPP_DEFAULT_MESSAGE = encodeURIComponent('Hallo! Ik heb een vraag over Droomvriendjes 🧸');
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MESSAGE}`;


const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    onderwerp: '',
    bericht: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          page_url: window.location.href
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        trackContactFormSubmit({
          ...formData,
          page_url: window.location.href
        });
        
        toast({
          title: "✅ Bericht verzonden!",
          description: "We nemen zo snel mogelijk contact met je op.",
        });
        setFormData({
          naam: '',
          email: '',
          telefoon: '',
          onderwerp: '',
          bericht: ''
        });
      } else {
        throw new Error(data.detail || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "❌ Fout",
        description: "Er ging iets mis bij het verzenden. Probeer het opnieuw of mail naar info@droomvriendjes.nl",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout backButtonText="Terug naar Home">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 text-center">Contact</h1>
        <p className="text-xl text-slate-600 text-center mb-12 max-w-3xl mx-auto">
          Heb je een vraag of wil je meer informatie? Neem gerust contact met ons op. 
          We helpen je graag!
        </p>

        {/* WhatsApp - Primary Contact */}
        <div className="max-w-2xl mx-auto mb-12">
          <a 
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-400 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* WhatsApp Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg viewBox="0 0 24 24" className="w-12 h-12 text-white fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        SNELSTE REACTIE
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Chat met ons via WhatsApp 💬
                    </h2>
                    <p className="text-slate-600 mb-4">
                      Direct antwoord op je vragen over producten, bestellingen of cadeau advies. 
                      Wij helpen je graag!
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <span className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-6 py-3 rounded-full group-hover:bg-green-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        Start WhatsApp Chat
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        +31 6 84588815
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-2xl mx-auto mb-12">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-slate-400 text-sm font-medium">of bereik ons via</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6 text-center">
              <Mail className="w-12 h-12 text-warm-brown-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600">info@droomvriendjes.nl</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6 text-center">
              <MapPin className="w-12 h-12 text-warm-brown-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Adres</h3>
              <p className="text-slate-600">Schaesbergerweg 103</p>
              <p className="text-slate-600">6415 AD Heerlen</p>
              <p className="text-sm text-slate-500 italic mt-2">(Dit is geen bezoekadres)</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 text-warm-brown-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Openingstijden</h3>
              <p className="text-slate-600">Ma - Vr: 9:00 - 17:00</p>
              <p className="text-slate-600">Za - Zo: Gesloten</p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-warm-brown-100">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Stuur ons een bericht</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Naam *</label>
                    <Input 
                      name="naam"
                      value={formData.naam}
                      onChange={handleChange}
                      placeholder="Je volledige naam"
                      required
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="je@email.nl"
                      required
                      className="border-warm-brown-200 focus:border-warm-brown-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telefoon</label>
                  <Input 
                    name="telefoon"
                    type="tel"
                    value={formData.telefoon}
                    onChange={handleChange}
                    placeholder="06-12345678"
                    className="border-warm-brown-200 focus:border-warm-brown-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Onderwerp *</label>
                  <Input 
                    name="onderwerp"
                    value={formData.onderwerp}
                    onChange={handleChange}
                    placeholder="Waar gaat je vraag over?"
                    required
                    className="border-warm-brown-200 focus:border-warm-brown-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Bericht *</label>
                  <Textarea 
                    name="bericht"
                    value={formData.bericht}
                    onChange={handleChange}
                    placeholder="Je bericht..."
                    required
                    rows={6}
                    className="border-warm-brown-200 focus:border-warm-brown-500"
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-warm-brown-500 hover:bg-warm-brown-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    'Verstuur Bericht'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 bg-warm-brown-50 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">Bedrijfsgegevens</h3>
            <div className="text-slate-700 space-y-1">
              <p><strong>Bedrijfsnaam:</strong> Droomvriendjes</p>
              <p><strong>KVK-nummer:</strong> 99210835</p>
              <p><strong>E-mailadres:</strong> info@droomvriendjes.nl</p>
              <p><strong>Adres:</strong> Schaesbergerweg 103, 6415 AD Heerlen</p>
              <p className="text-sm italic">(Dit is geen bezoekadres)</p>
            </div>
            <div className="mt-4 pt-4 border-t border-warm-brown-100">
              <h4 className="font-bold text-slate-900 mb-2">Retouradres:</h4>
              <p className="text-slate-700">Centerpoort-Nieuwgraaf</p>
              <p className="text-slate-700">Geograaf 16</p>
              <p className="text-slate-700">6921 EW Duiven</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
