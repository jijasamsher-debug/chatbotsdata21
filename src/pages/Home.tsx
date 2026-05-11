import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { subscriptionPlanMap } from '../constants/pricingPlans';
import { Bot, MessageCircle, Zap, BarChart3, CheckCircle, ArrowRight, Users, Clock, Globe } from 'lucide-react';
import { HomeDemoWidget } from '../components/HomeDemoWidget';
import customer01 from '../assets/customer-01.jpg';
import customer02 from '../assets/customer-02.jpg';
import customer03 from '../assets/customer-03.jpg';
import customer04 from '../assets/customer-04.jpg';
import customer05 from '../assets/customer-05.jpg';
import customer06 from '../assets/customer-06.jpg';
import customer07 from '../assets/customer-07.jpg';
import customer08 from '../assets/customer-08.jpg';
import customer09 from '../assets/customer-09.jpg';
import customer10 from '../assets/customer-10.jpg';
import customer11 from '../assets/customer-11.jpg';
import customer12 from '../assets/customer-12.jpg';

export const Home = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Leads Generator',
      description: 'Create conversational forms that engage visitors and collect high-quality leads automatically.'
    },
    {
      icon: Zap,
      title: 'Easy Integration',
      description: 'Embed your chatbot on any website with a simple iframe or script tag. No coding required.'
    },
    {
      icon: BarChart3,
      title: 'Lead Analytics',
      description: 'Track and export all collected leads with detailed analytics and CSV export capabilities.'
    },
    {
      icon: Globe,
      title: 'Page-Specific Rules',
      description: 'Customize bot behavior for different pages with dynamic URL-based configurations.'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: [
        '3 bots maximum',
        'Leads Generator only',
        'Unlimited chats',
        'First 30 leads visible',
        
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: subscriptionPlanMap.starter.name,
      price: `₹${subscriptionPlanMap.starter.monthlyPrice}`,
      period: 'month',
      features: subscriptionPlanMap.starter.features,
      cta: 'Start Free Trial',
      popular: subscriptionPlanMap.starter.popular || false
    },
    {
      name: subscriptionPlanMap.growth.name,
      price: `₹${subscriptionPlanMap.growth.monthlyPrice}`,
      period: 'month',
      features: subscriptionPlanMap.growth.features,
      cta: 'Start Free Trial',
      popular: subscriptionPlanMap.growth.popular || false
    }
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Active Users', numericEnd: 10000, suffix: '+' },
    { icon: MessageCircle, value: '1M+', label: 'Conversations', numericEnd: 1000000, suffix: '+', display: 'M+' },
    { icon: Bot, value: '50,000+', label: 'Bots Created', numericEnd: 50000, suffix: '+' },
    { icon: Clock, value: '24/7', label: 'Support', numericEnd: 0, suffix: '' }
  ];

  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<string[]>(stats.map(() => '0'));

  const formatNumber = useCallback((num: number, stat: typeof stats[0]) => {
    if (stat.label === 'Support') return '24/7';
    if (stat.label === 'Conversations') {
      if (num >= 1000000) return '1M+';
      return Math.floor(num / 1000) + 'K';
    }
    return num.toLocaleString() + stat.suffix;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [statsVisible]);

  useEffect(() => {
    if (!statsVisible) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues(stats.map((stat) => {
        if (stat.label === 'Support') return '24/7';
        const current = Math.floor(stat.numericEnd * eased);
        return formatNumber(current, stat);
      }));

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [statsVisible]);

  const leadHighlights = [
    { value: '50%', label: 'Less spending on sales' },
    { value: '24x7', label: 'Availability of business' },
    { value: '50 M', label: 'Responses collected so far' },
    { value: '0', label: 'Effort on collecting data' }
  ];

  const customerAvatars = [
    customer01,
    customer02,
    customer03,
    customer04,
    customer05,
    customer06,
    customer07,
    customer08,
    customer09,
    customer10,
    customer11,
    customer12
  ];

  const customerBubbleRows = [
    [
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 0, active: true },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 1 },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 2, active: true },
      { avatarIndex: -1 }
    ],
    [
      { avatarIndex: -1 },
      { avatarIndex: 3 },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 4, active: true },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 5 },
      { avatarIndex: -1 },
      { avatarIndex: 6, active: true }
    ],
    [
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 7 },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 8, active: true },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 9, active: true }
    ],
    [
      { avatarIndex: 10 },
      { avatarIndex: -1 },
      { avatarIndex: 11, active: true },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 1 },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 2 },
      { avatarIndex: -1 }
    ],
    [
      { avatarIndex: -1 },
      { avatarIndex: 3 },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 4, active: true },
      { avatarIndex: -1 },
      { avatarIndex: -1 },
      { avatarIndex: 5 },
      { avatarIndex: -1 },
      { avatarIndex: -1 }
    ]
  ];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 opacity-70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 sm:pt-6 sm:pb-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              Create Smart Chatbots
              <br />
              <span className="text-blue-600">In Minutes</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Build AI-powered chatbots and lead generation forms for your website. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-600 text-gray-900 dark:text-white text-lg font-semibold rounded-lg transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="mt-16 relative">
            <HomeDemoWidget />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={statsRef}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tabular-nums">
                    {animatedValues[index]}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful features to help you capture leads and engage visitors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-500 opacity-0 translate-y-6 animate-[cardReveal_0.6s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Get your chatbot up and running in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create Your Bot',
                description: 'Set up your lead generation bot, customize the design and questions'
              },
              {
                step: '2',
                title: 'Configure Settings',
                description: 'Set up your welcome message, theme, and add your knowledge base articles'
              },
              {
                step: '3',
                title: 'Embed & Launch',
                description: 'Copy the embed code and paste it on your website. That\'s it!'
              }
            ].map((item, index) => (
              <div key={index} className="relative opacity-0 translate-y-8 animate-[cardReveal_0.7s_ease-out_forwards]" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 transition-transform duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-blue-100">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-white/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 bg-background">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Convert more <span className="text-primary">visitors to leads</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              See the impact of switching from static forms to interactive conversations
            </p>
          </div>

          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {leadHighlights.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-3xl sm:text-4xl font-bold text-foreground">{item.value}</p>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="relative rounded-[2rem] border border-border/70 bg-card/50 backdrop-blur-xl p-4 sm:p-6 lg:p-8 overflow-hidden shadow-xl">
            <div className="w-full space-y-3">
              {customerBubbleRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-10 gap-2 sm:gap-3">
                  {row.map((bubble, bubbleIndex) => {
                    const hasAvatar = bubble.avatarIndex >= 0;
                    const avatar = hasAvatar ? customerAvatars[bubble.avatarIndex % customerAvatars.length] : null;
                    const animationDelay = `${(rowIndex * 0.22) + (bubbleIndex * 0.08)}s`;

                    return (
                      <div
                        key={`${rowIndex}-${bubbleIndex}`}
                        className="relative group flex justify-center"
                        style={{
                          animation: hasAvatar ? `floatBubble 3.5s ease-in-out ${animationDelay} infinite` : undefined
                        }}
                      >
                        <div
                          className={`h-7 w-7 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-full border border-border/80 shadow-sm flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 ${
                            hasAvatar
                              ? 'bg-card text-primary overflow-hidden ring-1 ring-primary/20'
                              : 'bg-muted text-muted-foreground/60'
                          } ${bubble.active ? 'ring-2 ring-primary/40 animate-pulse scale-105' : ''}`}
                          style={{
                            animation: hasAvatar
                              ? `avatarReveal 4.8s ease-in-out ${animationDelay} infinite`
                              : `emptyBubbleReveal 4.8s ease-in-out ${animationDelay} infinite`
                          }}
                        >
                          {avatar && (
                            <img
                              src={avatar}
                              alt="New customer"
                              loading="lazy"
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>

                        {hasAvatar && (
                          <div
                            className="absolute -bottom-8 left-1/2 whitespace-nowrap rounded-full border border-border bg-popover/95 backdrop-blur-sm px-2.5 py-1 text-[10px] text-popover-foreground shadow-sm flex items-center gap-1.5"
                            style={{
                              animation: `badgeReveal 4.8s ease-in-out ${animationDelay} infinite`
                            }}
                          >
                            <img
                              src={avatar ?? undefined}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              width={14}
                              height={14}
                              className="h-3.5 w-3.5 rounded-full object-cover"
                            />
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
                            New customer
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }

        @keyframes avatarReveal {
          0%, 12% { opacity: 0; transform: scale(0.84); }
          22%, 72% { opacity: 1; transform: scale(1); }
          82%, 100% { opacity: 0; transform: scale(0.88); }
        }

        @keyframes badgeReveal {
          0%, 18% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.92); }
          26%, 68% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          78%, 100% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.92); }
        }

        @keyframes emptyBubbleReveal {
          0%, 12% { opacity: 1; transform: scale(1); }
          22%, 72% { opacity: 0.28; transform: scale(0.88); }
          82%, 100% { opacity: 1; transform: scale(1); }
        }

        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-6 sm:p-8 relative transition-all ${
                  plan.popular
                    ? 'border-blue-600 shadow-xl md:scale-105'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-base sm:text-lg text-gray-500 dark:text-gray-400">/{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-8 min-h-[180px] sm:min-h-[200px]">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/pricing"
                  className={`block text-center py-3 px-6 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of businesses using Flood.chat to engage visitors and capture leads
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

    </div>
  );
};
