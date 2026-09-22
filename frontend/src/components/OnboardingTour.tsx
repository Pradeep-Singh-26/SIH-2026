import React, { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { soundEffects } from '../services/soundEffects';

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onFinish }) => {
  const driverRef = useRef<any>(null);

  useEffect(() => {
    // Add custom styling for driver.js popovers to match our premium aesthetic
    const styleId = 'driver-js-custom-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .driver-popover {
          border-radius: 12px !important;
          background-color: var(--bg-surface-elevated) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--cyan-primary) !important;
          box-shadow: 0 10px 40px rgba(0, 255, 255, 0.15) !important;
          font-family: var(--font-sans) !important;
          padding: 20px !important;
          max-width: 400px !important;
        }
        .driver-popover-title {
          color: var(--cyan-primary) !important;
          font-size: 1.15rem !important;
          font-weight: 600 !important;
          margin-bottom: 12px !important;
        }
        .driver-popover-description {
          color: var(--text-secondary) !important;
          font-size: 0.95rem !important;
          line-height: 1.5 !important;
        }
        .driver-popover-footer button {
          background-color: var(--bg-surface) !important;
          color: var(--text-primary) !important;
          border: 1px solid var(--border-glass) !important;
          text-shadow: none !important;
          border-radius: 6px !important;
          padding: 6px 12px !important;
          transition: all 0.2s ease !important;
        }
        .driver-popover-footer button:hover {
          background-color: var(--bg-surface-hover) !important;
        }
        .driver-popover-footer .driver-popover-next-btn {
          background-color: var(--cyan-primary) !important;
          color: black !important;
          font-weight: 600 !important;
          border: none !important;
        }
        .driver-popover-footer .driver-popover-next-btn:hover {
          background-color: var(--cyan-secondary) !important;
        }
        .driver-popover-arrow {
          border-color: var(--cyan-primary) !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (run) {
      if (!driverRef.current) {
        driverRef.current = driver({
          showProgress: true,
          animate: true,
          smoothScroll: true,
          allowClose: true,
          stagePadding: 5,
          overlayOpacity: 0.7,
          onPopoverRender: (popover, { state }) => {
            // Play sound on step change
            soundEffects.playClickSound();
          },
          onDestroyed: () => {
            onFinish();
            driverRef.current = null;
          },
          steps: [
            {
              popover: {
                title: 'Welcome to Hydro-Breach 🌊',
                description: `This platform simulates catastrophic dam breaches for Humanitarian Assistance and Disaster Relief (HADR).`,
                side: "bottom",
                align: "center"
              }
            },
            {
              element: '.tour-view-switcher',
              popover: {
                title: 'Dual Hydrodynamic Engines',
                description: `Switch seamlessly between the 2D Tactical GIS Map for broad spatial planning and the 3D Fluid Shock engine for granular wave particle visualization.`,
                side: "bottom", 
                align: 'start'
              }
            },
            {
              element: '.tour-scenario-setup',
              popover: {
                title: 'Scenario Setup',
                description: `Open the scenario setup panel to begin configuring the physical properties of the reservoir and breach.`,
                side: "right", 
                align: 'start'
              }
            },
            {
              element: '.tour-breach-conditions',
              popover: {
                title: 'Breach Conditions',
                description: `Select from pre-configured failure modes like Monsoon Overtopping or Foundation Piping Leak. You can also manually configure breach geometry, reservoir level, and terrain roughness.`,
                side: "right",
                align: 'start'
              }
            },
            {
              element: '.tour-timeline',
              popover: {
                title: 'Time-Series Isochrones',
                description: `Scrub through time to see the flood wave propagation. Arrival times are critical for predicting submersion of bridges and relief centers.`,
                side: "top", 
                align: 'center'
              }
            },
            {
              element: '.play-controls',
              popover: {
                title: 'Simulation Playback',
                description: `Use these controls to play or pause the simulation, step through time frames one-by-one, or adjust the time scaling (1x, 2x, 4x) for faster reviews.`,
                side: "top",
                align: 'start'
              }
            },
            {
              element: '.tour-map-layers',
              popover: {
                title: 'Geospatial Overlays',
                description: `Toggle critical operational layers. You can visualize Safe Relief Shelters (green) and Danger Zones (red), or toggle flood depth and velocity heatmaps.`,
                side: "right",
                align: 'start'
              }
            },
            {
              element: '.tour-map-styles',
              popover: {
                title: 'Map Views',
                description: `Switch between base maps suited for different use cases: Voyager (clean layout), Dark (high contrast overlays), Satellite (real-world imagery), or Topo (elevation contours).`,
                side: "right",
                align: 'start'
              }
            },
            {
              element: '.tour-export',
              popover: {
                title: 'Standardized GIS Exports',
                description: `Extract flood envelopes as ESRI Shapefiles, KML, or GeoJSON to share with ground rescue teams and QGIS operators.`,
                side: "right", 
                align: 'start'
              }
            }
          ]
        });
      }
      driverRef.current.drive();
    } else {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    }
    
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    }
  }, [run, onFinish]);

  return null;
};
