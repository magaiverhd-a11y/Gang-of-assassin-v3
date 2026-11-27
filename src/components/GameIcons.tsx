import { AbilityId, ItemId, SpecialItemId, WeaponId } from '../game/types';

interface IconProps {
  className?: string;
  color?: string;
}

export function AbilityIcon({
  id,
  className = 'w-6 h-6',
  color,
}: { id: AbilityId } & IconProps) {
  switch (id) {
    case 'fireball':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M13.5 3C13.5 7 9.5 8.5 9.5 13C9.5 14.9 10.7 16.5 12.4 17C11.9 15.8 12.3 14.3 13.5 13.5C14.1 15 15.5 15.5 15.5 17C15.5 19.2 13.7 21 11.5 21C7.9 21 5.5 18.1 5.5 14.5C5.5 10.2 9.4 7.3 13.5 3Z"
            fill={color || '#f97316'}
          />
          <path
            d="M16.2 7.2C17.8 9.2 19 11.4 19 14C19 17.9 16 21 12 21C14.8 20.5 16.5 18.2 16.5 15.6C16.5 13.5 15.1 12 14.5 10.5C15.4 9.7 16 8.5 16.2 7.2Z"
            fill="#fde047"
            opacity="0.9"
          />
          <circle cx="11.5" cy="16.5" r="2" fill="#fff7ed" />
        </svg>
      );

    case 'dash_attack':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M3 16.5L12.5 12.5L21 4L16.5 14.5L13 15.5L9.5 20L10.5 15.2L3 16.5Z"
            fill={color || '#ef4444'}
          />
          <path
            d="M4 9.5H11M2.5 12.5H8.5M6 19.5H12"
            stroke="#fca5a5"
            strokeWidth="1.8"
            strokeLinecap="square"
          />
        </svg>
      );

    case 'grapple':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M15 3.5L20.5 9M20.5 3.5L13.5 10.5"
            stroke={color || '#cbd5e1'}
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path
            d="M14.5 3.5H20.5V9.5"
            stroke="#f8fafc"
            strokeWidth="2.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M13 11L10.5 13.5M8.5 15.5L6 18M4.5 19.5L3 21"
            stroke={color || '#94a3b8'}
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          <circle cx="12" cy="12" r="2" fill="#e2e8f0" />
        </svg>
      );

    case 'gas_bomb':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M9.5 4H14.5V6.5L13.5 7.5V9.2C16.2 9.9 18 12.2 18 15C18 18.3 15.3 21 12 21C8.7 21 6 18.3 6 15C6 12.2 7.8 9.9 10.5 9.2V7.5L9.5 6.5V4Z"
            fill={color || '#22c55e'}
            fillOpacity="0.25"
            stroke={color || '#22c55e'}
            strokeWidth="1.8"
          />
          <path
            d="M7.8 15.2C8.4 17.5 10.1 19.2 12 19.2C13.9 19.2 15.6 17.5 16.2 15.2C14.8 14.6 13.4 15.8 12 15.2C10.6 14.6 9.2 14.4 7.8 15.2Z"
            fill={color || '#22c55e'}
          />
          <circle cx="10.5" cy="12.5" r="1.1" fill="#bbf7d0" />
          <circle cx="14" cy="11.5" r="0.9" fill="#bbf7d0" />
        </svg>
      );

    case 'fire_weapon':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M19.5 4.5L10 14M10 14L7.5 11.5M10 14L12.5 16.5M8.5 15.5L4.5 19.5"
            stroke="#fde68a"
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          <path
            d="M14.5 3.5C15 6 12 7.2 12 10C13.8 9.6 15.3 8.1 16 6.5C16.6 8.2 18 9.5 17.5 12C19.8 10.5 21 7.8 19.8 4.2C18 4.8 16.2 4.6 14.5 3.5Z"
            fill={color || '#f59e0b'}
          />
        </svg>
      );
    case 'cinder_palm':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M7 20V11.5C7 10.7 7.7 10 8.5 10C9.3 10 10 10.7 10 11.5V8C10 7.2 10.7 6.5 11.5 6.5C12.3 6.5 13 7.2 13 8V10.5V7.5C13 6.7 13.7 6 14.5 6C15.3 6 16 6.7 16 7.5V12L17.2 10.8C17.8 10.2 18.8 10.2 19.3 10.8C19.8 11.3 19.8 12.1 19.4 12.7L15.5 20H7Z"
            fill={color || '#a8a29e'}
          />
          <path d="M3 6.5L6 8M2.5 11H5.5M3.5 15.5L6 14.5" stroke="#ea580c" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'chain_storm':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M3 5L9 10L7 12L13 17L11 19L20 21" stroke={color || '#60a5fa'} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="9" cy="10" r="1.8" fill="#e0e7ff" />
          <circle cx="13" cy="17" r="1.8" fill="#e0e7ff" />
          <circle cx="20" cy="21" r="1.4" fill="#e0e7ff" />
        </svg>
      );
  }
}

export function WeaponIcon({
  id,
  className = 'w-5 h-5',
  color,
}: { id: WeaponId } & IconProps) {
  switch (id) {
    case 'whip':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4.5 19.5L8.5 15.5"
            stroke="#92400e"
            strokeWidth="2.8"
            strokeLinecap="square"
          />
          <path
            d="M8.5 15.5C11 13 10.5 9.5 13 7.5C15 5.8 18.5 6.2 19.5 8.5C20.3 10.4 18.6 12.6 16.5 12.2C15 11.9 14.8 10.2 16 9.5"
            stroke={color || '#e5a93c'}
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'sword':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M19.5 4.5L17 9.5L9.5 17L7 14.5L14.5 7L19.5 4.5Z"
            fill={color || '#93c5fd'}
          />
          <path
            d="M5.5 12.5L11.5 18.5M7 17L4.5 19.5"
            stroke="#e2e8f0"
            strokeWidth="2.2"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'hammer':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M13.5 10.5L5 19"
            stroke="#a8a29e"
            strokeWidth="2.5"
            strokeLinecap="square"
          />
          <path
            d="M10.5 6.5L14 3L21 10L17.5 13.5L10.5 6.5Z"
            fill={color || '#f97316'}
            stroke="#fed7aa"
            strokeWidth="1.2"
          />
        </svg>
      );
    case 'rapier':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M20.5 3.5L9 15"
            stroke={color || '#fda4af'}
            strokeWidth="2.1"
            strokeLinecap="square"
          />
          <path
            d="M7 13C10 13.5 11.5 15 11 18C8.5 18 7 16.5 7 13Z"
            stroke="#fb7185"
            strokeWidth="1.6"
            fill="#4c0519"
          />
          <path d="M7.5 16.5L4 20" stroke="#e5a93c" strokeWidth="2.2" strokeLinecap="square" />
        </svg>
      );
    case 'greataxe':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M16 8L5 19" stroke="#78716c" strokeWidth="2.6" strokeLinecap="square" />
          <path
            d="M11 4.5C15.5 3.5 19.5 6 20.5 10.5C17.5 11 15 10 13 8.5C12 6.8 11.5 5.8 11 4.5Z"
            fill={color || '#f59e0b'}
            stroke="#fef08a"
            strokeWidth="1"
          />
          <path
            d="M19.5 13C18.5 17 15.5 19 11.5 18.5C13 16 14 14 15.5 12.5C17 12.5 18.2 12.7 19.5 13Z"
            fill="#334155"
            stroke="#f59e0b"
            strokeWidth="1"
          />
        </svg>
      );
    case 'naginata':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M14.5 9.5L4 20" stroke="#785a46" strokeWidth="2.2" strokeLinecap="square" />
          <path
            d="M14 10C16 7 18.5 5 21 3.5C20.5 7 19 9.5 16 11.5L14 10Z"
            fill={color || '#38bdf8'}
            stroke="#e0f2fe"
            strokeWidth="0.9"
          />
          <circle cx="14" cy="10" r="1.6" fill="#e5a93c" />
        </svg>
      );
    case 'katana':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M20 3.5C16.8 6.8 13.5 10.5 9.2 14.8L7.8 13.4C12 9.2 15.6 5.8 20 3.5Z"
            fill={color || '#f8fafc'}
            stroke="#f43f5e"
            strokeWidth="0.9"
          />
          <path
            d="M6.8 12.6L10.4 16.2"
            stroke="#e5a93c"
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          <path
            d="M7.8 15.2L4.2 19.5"
            stroke="#9f1239"
            strokeWidth="2.6"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'ribbon_whip':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4.5 19.5L8.2 15.8" stroke="#e5a93c" strokeWidth="2.4" strokeLinecap="square" />
          <path
            d="M8.2 15.8C10 12 8.5 8 12.2 6.2C15.5 4.6 19.2 6.5 19.5 9.8C19.8 12.8 16.5 14.4 14.4 12.5C13 11.2 13.8 8.8 16 9"
            stroke={color || '#f472b6'}
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="16.4" cy="9.1" r="1.4" fill="#fde68a" />
        </svg>
      );
    case 'silk_whip':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4.5 19.5L8 16" stroke="#fde68a" strokeWidth="2.4" strokeLinecap="square" />
          <path
            d="M8 16C9.5 11.5 12.5 5 17 5C20 5 21 8.5 18.8 11.2C16.8 13.6 13.5 12.5 14 10C14.5 7.8 17.5 8 17.5 8"
            stroke={color || '#c084fc'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M9.5 14.5C11.5 13 13 15.5 16 15"
            stroke="#f9a8d4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="17.6" cy="8.2" r="1.5" fill="#fef08a" />
        </svg>
      );
    case 'ash_wraps':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="8" width="11" height="9" rx="2.5" fill={color || '#d6d3d1'} />
          <path d="M6.5 10.5H16.5M6.5 13H16.5M6.5 15.5H16.5" stroke="#78716c" strokeWidth="1.1" />
          <path d="M9 17V21M14 17V21" stroke="#a8a29e" strokeWidth="2" />
          <path d="M8 8V5.5M11 8V5M14 8V5.5" stroke="#e7e5e4" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'spire_staff':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 21L15.5 8.5" stroke="#5b3a24" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="17" cy="6.5" r="3.2" stroke="#5b3a24" strokeWidth="1.4" />
          <path d="M17 3.8L18.6 6.5L17 9.2L15.4 6.5Z" fill={color || '#60a5fa'} />
          <circle cx="17" cy="6.5" r="5" fill={color || '#60a5fa'} opacity="0.18" />
        </svg>
      );
  }
}

export function WeaponSkillIcon({
  id,
  className = 'w-5 h-5',
}: { id: WeaponId; className?: string }) {
  switch (id) {
    case 'whip':
      // Backdash phantom chevrons
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M11 6L5 12L11 18"
            stroke="#e5a93c"
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          <path
            d="M17.5 6L11.5 12L17.5 18"
            stroke="#93c5fd"
            strokeWidth="2"
            strokeLinecap="square"
            opacity="0.75"
          />
        </svg>
      );
    case 'sword':
      // Blade Wave crescent
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M9 4C15.5 5 19 8.5 19 12C19 15.5 15.5 19 9 20C13 17.5 14.5 15 14.5 12C14.5 9 13 6.5 9 4Z"
            fill="#93c5fd"
          />
          <path
            d="M4.5 9H10M3.5 12H11M4.5 15H10"
            stroke="#dbeafe"
            strokeWidth="1.6"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'rapier':
      // Phantom Lunge piercing crimson lance
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M3 12H19.5" stroke="#fb7185" strokeWidth="2.4" strokeLinecap="square" />
          <path d="M14.5 7L20.5 12L14.5 17" stroke="#ffe4e6" strokeWidth="2" strokeLinecap="square" />
          <path d="M4 8H9M4 16H9" stroke="#f43f5e" strokeWidth="1.5" opacity="0.8" />
        </svg>
      );
    case 'hammer':
      // Meteor Slam: Big Leap + Ground Crater Explosion
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 11C6 5 11 4 12.5 9L12.5 15"
            stroke="#fdba74"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M9.5 12L12.5 15.5L15.5 12" stroke="#fef08a" strokeWidth="2" strokeLinecap="square" />
          <path
            d="M2.5 19L6.5 15.5L9.5 19H15.5L18.5 15.5L22 19"
            stroke="#f97316"
            strokeWidth="2.2"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'greataxe':
      // Cyclone Cleave spinning blades
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4.5 10C6.5 5.5 12 4 17 6.5L19.5 4.5V10.5H13.5"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M19.5 14C17.5 18.5 12 20 7 17.5L4.5 19.5V13.5H10.5"
            stroke="#fde047"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'naginata':
      // Tempest Vault lightning crescent
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M5 17C6.5 9.5 12 5 19.5 5.5C16.5 10.5 13 14.5 8 18L5 17Z"
            fill="#38bdf8"
          />
          <path
            d="M13 4L10.5 11H14.5L11.5 19.5"
            stroke="#fef08a"
            strokeWidth="1.9"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'katana':
      // Iaijutsu Gale charged mega slash arc
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4.5 18.5C6.5 10.5 12.5 5.5 20.5 4.5C17.5 10.5 14 14.8 8 19.5L4.5 18.5Z"
            fill="#f43f5e"
          />
          <path
            d="M6.5 17.5C9.5 12.5 14 8.5 19.5 6"
            stroke="#fef08a"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'ribbon_whip':
    case 'silk_whip':
      // Encore / Crescendo Waltz spinning musical ribbons
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 12C6 7 10.5 5.5 15.5 7.5C18.5 8.7 20 11.5 19.2 14.5C18.2 18 13.5 19.5 9 18"
            stroke={id === 'silk_whip' ? '#c084fc' : '#f472b6'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M11 15V7.5L16.5 6V12.5"
            stroke="#fde68a"
            strokeWidth="1.8"
            strokeLinecap="square"
          />
          <circle cx="9.5" cy="15.2" r="2" fill="#f9a8d4" />
          <circle cx="15" cy="13" r="1.8" fill="#fde68a" />
        </svg>
      );
    case 'ash_wraps':
      // Pyre Dash: ash streaks behind a forward fist
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M2.5 8H10M1.5 12H9M2.5 16H10" stroke="#a8a29e" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M11 7.5H18C19.7 7.5 21 8.8 21 10.5V13.5C21 15.2 19.7 16.5 18 16.5H11Z" fill="#d6d3d1" />
          <path d="M14 7.5V16.5M17 7.5V16.5" stroke="#78716c" strokeWidth="1" />
          <circle cx="7" cy="19.5" r="1" fill="#ea580c" />
          <circle cx="4.5" cy="5" r="0.9" fill="#ea580c" />
        </svg>
      );
    case 'spire_staff':
      // Repulsion Nova: rings pushing outward
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="#e0e7ff" />
          <circle cx="12" cy="12" r="6.2" stroke="#60a5fa" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="9.5" stroke="#818cf8" strokeWidth="1.4" opacity="0.7" />
          <path d="M12 1.5V4M12 20V22.5M1.5 12H4M20 12H22.5" stroke="#e0e7ff" strokeWidth="1.5" />
        </svg>
      );
  }
}

export function ItemIcon({
  id,
  className = 'w-5 h-5',
}: { id: ItemId; className?: string }) {
  switch (id) {
    case 'health_potion':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M9.5 4H14.5V6.5L13.5 7.5V9C16 9.8 17.5 12 17.5 14.8C17.5 18.2 15 20.5 12 20.5C9 20.5 6.5 18.2 6.5 14.8C6.5 12 8 9.8 10.5 9V7.5L9.5 6.5V4Z"
            fill="#991b1b"
            stroke="#f87171"
            strokeWidth="1.6"
          />
          <path d="M12 12V17M9.5 14.5H14.5" stroke="#fecaca" strokeWidth="1.8" />
        </svg>
      );
    case 'mana_potion':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M9.5 4H14.5V6.5L13.5 7.5V9.2L17.5 16.5C18.3 18 17.2 20 15.5 20H8.5C6.8 20 5.7 18 6.5 16.5L10.5 9.2V7.5L9.5 6.5V4Z"
            fill="#1d4ed8"
            stroke="#93c5fd"
            strokeWidth="1.6"
          />
          <path d="M9 16.5H15" stroke="#dbeafe" strokeWidth="1.6" />
        </svg>
      );
    case 'armor_potion':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3.5L18.5 6V11.8C18.5 16 15.7 19.2 12 20.5C8.3 19.2 5.5 16 5.5 11.8V6L12 3.5Z"
            fill="#334155"
            stroke="#cbd5e1"
            strokeWidth="1.7"
          />
          <path d="M12 6.5V17.5" stroke="#e2e8f0" strokeWidth="1.5" opacity="0.8" />
        </svg>
      );
  }
}

export function SpecialItemIcon({
  id,
  className = 'w-5 h-5',
}: { id: SpecialItemId; className?: string }) {
  switch (id) {
    case 'eclipse_hourglass':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 3.5H18M6 20.5H18" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="square" />
          <path
            d="M7.5 4.5V7.5C7.5 9.8 10.2 11.2 12 12C13.8 11.2 16.5 9.8 16.5 7.5V4.5H7.5Z"
            fill="#3b0764"
            stroke="#c084fc"
            strokeWidth="1.5"
          />
          <path
            d="M7.5 19.5V16.5C7.5 14.2 10.2 12.8 12 12C13.8 12.8 16.5 14.2 16.5 16.5V19.5H7.5Z"
            fill="#2e1065"
            stroke="#c084fc"
            strokeWidth="1.5"
          />
          <path d="M9.5 7H14.5L12 10L9.5 7Z" fill="#fde047" />
          <path d="M9.5 18H14.5L12 15.2L9.5 18Z" fill="#a855f7" />
          <circle cx="12" cy="12" r="1.4" fill="#fef08a" />
        </svg>
      );
    case 'hero_tag_horn':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 17.5C6.5 16.5 9.5 13.5 12.5 8.5L19.5 5.5L17.5 14C13.5 15.5 9.5 17 5.5 19.5L4 17.5Z"
            fill="#1e3a5f"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M18 4.5C20 6.5 20.5 9.5 19.5 12.5" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12.5 11.5L15 13" stroke="#e5a93c" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="7.5" cy="16.5" r="1.3" fill="#bae6fd" />
        </svg>
      );
  }
}
