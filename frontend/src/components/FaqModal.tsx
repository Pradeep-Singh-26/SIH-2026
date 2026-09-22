import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    soundEffects.playClickSound();
    setIsOpen(!isOpen);
  };

  return (
    <div style={{
      borderBottom: '1px solid var(--border-glass)',
      padding: '12px 0'
    }}>
      <button 
        onClick={toggleOpen}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
          fontSize: '0.9rem'
        }}
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp size={18} style={{ color: 'var(--cyan-primary)' }}/> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }}/>}
      </button>
      {isOpen && (
        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {answer}
        </div>
      )}
    </div>
  );
};

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 680 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <HelpCircle size={20} style={{ color: 'var(--cyan-primary)' }} />
            <span>Frequently Asked Questions & Settings Guide</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close FAQ">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
          
          <FaqItem 
            question="What is the difference between Delft3D and DualSPHysics (SPH) mode?"
            answer={
              <>
                <b>Delft3D-FM (2D SWE):</b> Solves 2D Shallow Water Equations over an unstructured mesh. It is extremely fast and accurate for broad, large-scale downstream river routing and flood plain mapping.<br/><br/>
                <b>DualSPHysics (3D SPH):</b> A Lagrangian particle-based solver that calculates Navier-Stokes equations without a fixed grid. It is computationally heavy but excels at modeling violent, near-field 3D fluid shocks immediately at the dam breach point.
              </>
            }
          />
          
          <FaqItem 
            question="What is Manning's Roughness Coefficient (n)?"
            answer={
              <>
                Manning's <i>n</i> is an empirical coefficient representing the resistance to flow in channels and floodplains. 
                <ul>
                  <li><i>0.03 - 0.04:</i> Clean, straight natural streams.</li>
                  <li><i>0.05 - 0.08:</i> Sluggish reaches with weedy pools or heavy brush (delays flood arrival).</li>
                  <li><i>0.10+:</i> Dense urban centers with high flow obstruction.</li>
                </ul>
              </>
            }
          />

          <FaqItem 
            question="How is the Breach Formation Time calculated?"
            answer={
              <>
                We use the <b>Froehlich (2008)</b> empirical equations, which analyze physical parameters (reservoir volume, breach height) to estimate how quickly the embankment fails. Faster breach times result in higher, more catastrophic peak discharges (Qp).
              </>
            }
          />

          <FaqItem 
            question="What are Arrival Isochrones?"
            answer={
              <>
                Isochrones are contour lines connecting points where the flood wave arrives at the exact same time (e.g., T+2 hours). They are essential for HADR (Humanitarian Assistance & Disaster Relief) teams to establish Evacuation Lead Times.
              </>
            }
          />

          <FaqItem 
            question="How does the Population at Risk (PAR) estimation work?"
            answer={
              <>
                It utilizes the <b>Graham (1999) / USACE</b> methodology, correlating flood depths, velocities, and warning times to estimate exposed population and potential casualties. High warning time combined with accessible high-ground shelters significantly reduces the fatality rate.
              </>
            }
          />

        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.45rem 1.25rem' }}>
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
