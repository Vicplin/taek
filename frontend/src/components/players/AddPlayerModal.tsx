
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import GamingButton from '@/components/shared/GamingButton';
import { calculateWeightClass, calculateAge } from '@/lib/utils/weight-calculator';
import { getClubs, getRaces, getBeltRanks, getGenders } from '@/lib/api/dashboard';

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  error?: string;
  placeholder?: string;
}

const SelectField = ({ label, name, value, options, onChange, error, placeholder = "Select Option" }: SelectFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setCoords({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            bottom: window.innerHeight - rect.top + 4,
          });
        }
      };

      updatePosition();
      
      const handleScroll = (e: Event) => {
        // Don't close if scrolling the dropdown itself
        if (dropdownRef.current && e.target === dropdownRef.current) {
          return;
        }
        setIsOpen(false);
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOpen = () => {
    if (!isOpen) {
      setSearchTerm("");
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleOpen}
          className={`w-full px-4 py-3 text-left bg-black/40 border rounded-lg transition-all font-rajdhani flex items-center justify-between
            ${error 
              ? 'border-red-500 focus:border-red-500' 
              : isOpen 
                ? 'border-arena-red ring-1 ring-arena-red' 
                : 'border-white/10 hover:border-white/30'
            }
            ${!value ? 'text-gray-600' : 'text-white'}
          `}
        >
          <span className="truncate">{value || placeholder}</span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-arena-red' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[9999] isolate">
                <div 
                  className="fixed inset-0 bg-transparent" 
                  onClick={() => setIsOpen(false)} 
                />
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    bottom: coords.bottom,
                    left: coords.left,
                    width: coords.width,
                  }}
                  className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-white/5"
                >
                  <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10 p-2">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type to search..."
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-md text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-arena-red"
                    />
                  </div>
                  {filteredOptions.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-500 font-rajdhani">
                      No results
                    </div>
                  ) : (
                    filteredOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          onChange(name, option);
                          setIsOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left font-rajdhani transition-colors
                          ${value === option 
                            ? 'bg-arena-red/10 text-arena-red' 
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }
                        `}
                      >
                        {option}
                      </button>
                    ))
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  full_name: string;
  ic_number: string;
  birth_date: string;
  gender: string;
  race: string;
  belt_rank: string;
  weight: string;
  height: string;
  club: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function AddPlayerModal({ isOpen, onClose, onSuccess }: AddPlayerModalProps) {
  const [user, setUser] = useState<any>(null); // Placeholder
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const [loading, setLoading] = useState(false);
  const [clubOptions, setClubOptions] = useState<string[]>([]);
  const [raceOptions, setRaceOptions] = useState<string[]>([]);
  const [beltOptions, setBeltOptions] = useState<string[]>([]);
  const [genderOptions, setGenderOptions] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    ic_number: '',
    birth_date: '',
    gender: '',
    race: '',
    belt_rank: '',
    weight: '',
    height: '',
    club: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [calculatedClass, setCalculatedClass] = useState<{ category: string; weightClass: string; ageGroup: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clubs, races, belts, genders] = await Promise.all([
          getClubs(),
          getRaces(),
          getBeltRanks(),
          getGenders()
        ]);

        if (clubs && clubs.length > 0) {
          setClubOptions(clubs.map(c => c.name));
        }

        if (races && races.length > 0) {
          setRaceOptions(races);
        }

        if (belts && belts.length > 0) {
          setBeltOptions(belts);
        }

        if (genders && genders.length > 0) {
          setGenderOptions(genders);
        }
      } catch (error) {
        console.error('Unexpected error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Auto-calculate weight class when weight or birth_date changes
  useEffect(() => {
    if (formData.weight && formData.gender) {
      const weight = parseFloat(formData.weight);
      if (!isNaN(weight)) {
        const gender = formData.gender === 'Male' ? 'Male' : formData.gender === 'Female' ? 'Female' : null;
        
        if (gender) {
             const result = calculateWeightClass(weight, gender, formData.birth_date);
             setCalculatedClass(result);
        }
      }
    } else {
      setCalculatedClass(null);
    }
  }, [formData.birth_date, formData.weight, formData.gender]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // IC Number Logic
    if (name === 'ic_number') {
      // Only allow numbers
      const numericValue = value.replace(/\D/g, '');
      
      // Limit to 12 chars
      if (numericValue.length > 12) return;
      
      // Auto-detect gender
      let newGender = formData.gender;
      if (numericValue.length === 12) {
        const lastDigit = parseInt(numericValue.slice(-1));
        newGender = lastDigit % 2 !== 0 ? 'Male' : 'Female';
      }
      
      setFormData(prev => ({ 
        ...prev, 
        ic_number: numericValue,
        gender: newGender
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.full_name) newErrors.full_name = 'Full Name is required';
    if (!formData.ic_number) {
      newErrors.ic_number = 'IC Number is required';
    } else if (formData.ic_number.length !== 12) {
      newErrors.ic_number = 'IC Number must be exactly 12 digits';
    }
    if (!formData.birth_date) newErrors.birth_date = 'Date of Birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.race) newErrors.race = 'Race is required';
    if (!formData.belt_rank) newErrors.belt_rank = 'Belt Rank is required';
    if (!formData.weight) newErrors.weight = 'Weight is required';
    if (!formData.height) newErrors.height = 'Height is required';
    if (!formData.club) newErrors.club = 'Club is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) return;

    setLoading(true);
    try {
      // Look up club_id if a club was selected
      let clubId: string | null = null;
      if (formData.club) {
        const { data: club, error: clubError } = await supabase
          .from('clubs')
          .select('id')
          .eq('name', formData.club)
          .eq('is_active', true)
          .maybeSingle();

        if (clubError) {
          console.error('Error looking up club:', clubError.message);
        } else {
          clubId = club?.id ?? null;
        }
      }

      const { error } = await supabase
        .from('fighters')
        .insert({
          user_id: user.id,
          club_id: clubId,
          full_name: formData.full_name,
          ic_number: formData.ic_number,
          date_of_birth: formData.birth_date,
          gender: formData.gender === 'Female' ? 'female' : 'male',
          race: formData.race || null,
          belt_rank: formData.belt_rank,
          weight_kg: parseFloat(formData.weight),
          height_cm: parseFloat(formData.height),
        });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#151515] rounded-xl overflow-hidden shadow-2xl border border-white/5 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide uppercase">Add New Player</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani ${errors.full_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-arena-red focus:ring-arena-red'}`}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name}</p>}
                </div>

                {/* IC Number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">IC Number</label>
                  <input
                    type="text"
                    name="ic_number"
                    value={formData.ic_number}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani ${errors.ic_number ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-arena-red focus:ring-arena-red'}`}
                    placeholder="Enter IC Number"
                  />
                  {errors.ic_number && <p className="text-red-500 text-xs">{errors.ic_number}</p>}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Birth</label>
                    {formData.birth_date && (
                      <span className="text-xs font-bold text-arena-red font-orbitron">
                        {calculateAge(formData.birth_date)} YEARS OLD
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani ${errors.birth_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-arena-red focus:ring-arena-red'}`}
                  />
                  {errors.birth_date && <p className="text-red-500 text-xs">{errors.birth_date}</p>}
                </div>

                {/* Gender */}
                <SelectField
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  options={genderOptions}
                  onChange={handleSelectChange}
                  error={errors.gender}
                  placeholder="Select Gender"
                />

                {/* Race */}
                <SelectField
                  label="Race"
                  name="race"
                  value={formData.race}
                  options={raceOptions}
                  onChange={handleSelectChange}
                  error={errors.race}
                  placeholder="Select Race"
                />

                {/* Belt Rank */}
                <SelectField
                  label="Belt Rank"
                  name="belt_rank"
                  value={formData.belt_rank}
                  options={beltOptions}
                  onChange={handleSelectChange}
                  error={errors.belt_rank}
                  placeholder="Select Belt"
                />

                {/* Weight */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weight (kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className={`block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani ${errors.weight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-arena-red focus:ring-arena-red'}`}
                      placeholder="0.0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 font-bold text-xs">KG</div>
                  </div>
                  {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Height (cm)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className={`block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani ${errors.height ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-arena-red focus:ring-arena-red'}`}
                      placeholder="0.0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 font-bold text-xs">CM</div>
                  </div>
                  {errors.height && <p className="text-red-500 text-xs">{errors.height}</p>}
                </div>

                {/* Calculated Weight Class Display */}
                <AnimatePresence>
                  {calculatedClass && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="col-span-1 md:col-span-2 overflow-hidden"
                    >
                      <div className="bg-arena-red/10 border border-arena-red/20 rounded-lg p-4 flex items-center justify-between shadow-[0_0_15px_rgba(230,57,70,0.1)]">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold mb-0.5">Weight Class</span>
                            <span className="text-white font-orbitron font-bold text-xl tracking-wide">{calculatedClass.weightClass}</span>
                          </div>
                        </div>
                        <div className="text-right border-l border-white/10 pl-4">
                          <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold mb-0.5">Age Group</span>
                          <span className="text-arena-red font-bold text-lg">{calculatedClass.ageGroup}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Club */}
                <div className="col-span-1 md:col-span-2">
                  <SelectField
                    label="Club"
                    name="club"
                    value={formData.club}
                    options={clubOptions}
                    onChange={handleSelectChange}
                    error={errors.club}
                    placeholder="Select Club"
                  />
                </div>
              </div>

              <div className="pt-4">
                <GamingButton 
                  type="submit"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'ADDING PLAYER...' : 'ADD PLAYER'}
                </GamingButton>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
