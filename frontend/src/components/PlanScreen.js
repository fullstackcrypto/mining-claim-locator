import React, { useState } from 'react';

const PlanScreen = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div style={{
      backgroundColor: '#111827',
      color: '#fff',
      minHeight: '100vh',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '640px', width: '100%' }}>
        {/* Back button simulation */}
        <button 
          onClick={() => window.history.back()}
          style={{
            color: '#60a5fa',
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            marginBottom: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← Back to App
        </button>

        <h1 style={{
          textAlign: 'center',
          fontSize: '2.25rem',
          fontWeight: '700',
          marginBottom: '2rem'
        }}>
          Choose a Plan to Trial
        </h1>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1f2937',
          borderRadius: '9999px',
          padding: '4px',
          width: 'fit-content',
          margin: '0 auto 2rem'
        }}>
          <button 
            onClick={() => setIsAnnual(true)}
            style={{
              padding: '10px 32px',
              borderRadius: '9999px',
              backgroundColor: isAnnual ? '#3b82f6' : 'transparent',
              color: isAnnual ? '#fff' : '#9ca3af',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Annual
          </button>
          <button 
            onClick={() => setIsAnnual(false)}
            style={{
              padding: '10px 32px',
              borderRadius: '9999px',
              backgroundColor: !isAnnual ? '#3b82f6' : 'transparent',
              color: !isAnnual ? '#fff' : '#9ca3af',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Monthly
          </button>
        </div>

        {/* Plan Card */}
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '16px',
          padding: '2rem',
          position: 'relative',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                MINE FINDER
                <span style={{ color: '#ef4444', fontSize: '1.5rem' }}>.</span>
              </h2>
              <p style={{ color: '#9ca3af', margin: '0.5rem 0 1.5rem', fontSize: '1.1rem' }}>
                Access nationwide mining claims, owner details & create interactive maps.
              </p>
            </div>
            <div style={{
              backgroundColor: '#22c55e',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '9999px',
              transform: 'rotate(12deg)'
            }}>
              New
            </div>
          </div>

          <div style={{
            backgroundColor: '#374151',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <h3 style={{ fontSize: '1.75rem', margin: 0 }}>Mine Finder Pro</h3>
                <p style={{ color: '#22c55e', fontWeight: '600', margin: '0.25rem 0' }}>Free 7-day trial, Save 53%</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" checked style={{ accentColor: '#3b82f6' }} />
              </label>
            </div>

            <p style={{ fontSize: '1.1rem', margin: '1rem 0' }}>
              Nationwide Mining Claims, Owner Info & AI Smart Search
            </p>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '3rem', fontWeight: '700', lineHeight: 1 }}>$7</span>
                <span style={{ fontSize: '1.1rem', color: '#9ca3af' }}> / month equivalent</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '3rem', fontWeight: '700', lineHeight: 1 }}>$84</span>
                <span style={{ fontSize: '1.1rem', color: '#9ca3af' }}> / year billed</span>
              </div>
            </div>

            <button 
              style={{
                width: '100%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                padding: '1rem 2rem',
                fontSize: '1.25rem',
                fontWeight: '600',
                borderRadius: '9999px',
                marginTop: '2rem',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgb(59 130 246 / 0.5)'
              }}
              onClick={() => alert('Free trial started! (Demo - Stripe integration coming soon)')
            }
            >
              Start Your Free Trial
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#9ca3af' }}>
              per user, billed annually
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#9ca3af' }}>
            <a href="#" style={{ color: '#60a5fa', textDecoration: 'underline' }}>See Benefits...</a>
            <span>Cancel anytime · Terms & Conditions apply</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanScreen;
