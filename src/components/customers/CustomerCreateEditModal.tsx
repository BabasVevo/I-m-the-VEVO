import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  AlertCircle, 
  Phone, 
  Mail, 
  CreditCard, 
  Calendar,
  Plus
} from 'lucide-react';
import type { Customer, CustomerType, CustomerStatus, Tag, Branch } from '@/types/database';
import { createCustomer, updateCustomer, createTag } from '@/services/customerService';
import { useToast } from '@/context/ToastContext';

interface CustomerCreateEditModalProps {
  isOpen: boolean;
  businessId: string;
  customerToEdit?: Customer | null;
  branches: Branch[];
  availableTags: Tag[];
  onSaved: (customer: Customer) => void;
  onClose: () => void;
  onRefreshTags?: () => void;
}

export function CustomerCreateEditModal({
  isOpen,
  businessId,
  customerToEdit,
  branches,
  availableTags,
  onSaved,
  onClose,
  onRefreshTags,
}: CustomerCreateEditModalProps) {
  const { addToast } = useToast();
  const isEditing = Boolean(customerToEdit);

  // Form State
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'financial' | 'tags'>('basic');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('regular');
  const [status, setStatus] = useState<CustomerStatus>('active');
  const [assignedBranchId, setAssignedBranchId] = useState<string>('');
  
  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bujumbura');
  const [country, setCountry] = useState('Burundi');

  // Demographics & Financial
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');

  // Tags
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate data when editing
  useEffect(() => {
    if (customerToEdit) {
      setFirstName(customerToEdit.first_name || '');
      setLastName(customerToEdit.last_name || '');
      setCompanyName(customerToEdit.customer_type === 'wholesale' || customerToEdit.customer_type === 'corporate' ? customerToEdit.name : '');
      setCustomerType(customerToEdit.customer_type || 'regular');
      setStatus(customerToEdit.status || 'active');
      setAssignedBranchId(customerToEdit.assigned_branch_id || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setCity(customerToEdit.city || 'Bujumbura');
      setCountry(customerToEdit.country || 'Burundi');
      setDateOfBirth(customerToEdit.date_of_birth ? customerToEdit.date_of_birth.substring(0, 10) : '');
      setGender((customerToEdit.gender as 'male' | 'female' | 'other') || '');
      setCreditLimit(customerToEdit.credit_limit ? String(customerToEdit.credit_limit) : '0');
      setNotes(customerToEdit.notes || '');
      setSelectedTagIds(customerToEdit.tags ? customerToEdit.tags.map((t) => t.id) : []);
    } else {
      setFirstName('');
      setLastName('');
      setCompanyName('');
      setCustomerType('regular');
      setStatus('active');
      setAssignedBranchId(branches[0]?.id || '');
      setPhone('');
      setEmail('');
      setAddress('');
      setCity('Bujumbura');
      setCountry('Burundi');
      setDateOfBirth('');
      setGender('');
      setCreditLimit('0');
      setNotes('');
      setSelectedTagIds([]);
    }
    setError(null);
    setActiveTab('basic');
  }, [customerToEdit, branches, isOpen]);

  if (!isOpen) return null;

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateQuickTag = async () => {
    if (!newTagName.trim()) return;
    try {
      setIsCreatingTag(true);
      const tag = await createTag(businessId, newTagName.trim(), newTagColor);
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setNewTagName('');
      onRefreshTags?.();
      addToast({
        type: 'success',
        title: 'Tag Created',
        message: `Tag #${tag.name} created and added.`,
      });
    } catch (err) {
      console.error('Error creating tag:', err);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const computedName = (
      customerType === 'corporate' || customerType === 'wholesale'
        ? (companyName.trim() || `${firstName} ${lastName}`.trim())
        : (`${firstName} ${lastName}`.trim() || companyName.trim())
    );

    if (!computedName) {
      setError('Please provide at least a customer first/last name or business name.');
      setActiveTab('basic');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditing && customerToEdit) {
        const updated = await updateCustomer(customerToEdit.id, {
          name: computedName,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          city: city.trim() || 'Bujumbura',
          country: country.trim() || 'Burundi',
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          customer_type: customerType,
          status,
          credit_limit: parseFloat(creditLimit) || 0,
          assigned_branch_id: assignedBranchId || null,
          notes: notes.trim() || null,
          tag_ids: selectedTagIds,
        });

        addToast({
          type: 'success',
          title: 'Customer Updated',
          message: `${updated.name} has been updated successfully.`,
        });

        onSaved(updated);
      } else {
        const { customer: created, duplicateWarning } = await createCustomer({
          business_id: businessId,
          name: computedName,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          city: city.trim() || 'Bujumbura',
          country: country.trim() || 'Burundi',
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          customer_type: customerType,
          status,
          credit_limit: parseFloat(creditLimit) || 0,
          assigned_branch_id: assignedBranchId || null,
          notes: notes.trim() || null,
          tag_ids: selectedTagIds,
        });

        if (duplicateWarning) {
          addToast({
            type: 'warning',
            title: 'Duplicate Phone Number',
            message: duplicateWarning,
          });
        }

        addToast({
          type: 'success',
          title: 'Customer Registered',
          message: `${created.name} registered successfully.`,
        });

        onSaved(created);
      }

      onClose();
    } catch (err: unknown) {
      console.error('Error saving customer:', err);
      setError((err as Error).message || 'Failed to save customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                {isEditing ? 'Edit Customer Profile' : 'Register New Customer'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEditing ? 'Update contact details, credit limit, and tags' : 'Add customer to CRM directory and POS selection'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 text-xs font-semibold dark:border-navy-800 dark:bg-navy-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'basic'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            1. Identity & Type
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'contact'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            2. Contact & Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'financial'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            3. Credit & Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === 'tags'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            4. Tags & Segmentation
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: BASIC & TYPE */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Customer Type
                    </label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    >
                      <option value="regular">Regular Shopper</option>
                      <option value="vip">VIP / High Value</option>
                      <option value="wholesale">Wholesale Buyer</option>
                      <option value="corporate">Corporate / Institution</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Account Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked / Suspended</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* If Wholesale / Corporate, show Business Title */}
                {(customerType === 'wholesale' || customerType === 'corporate') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Company / Organization Name <span className="text-brand-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Serengeti Safari Ltd"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Joseph"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Mrope"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Assigned Branch (Home Store)
                    </label>
                    <select
                      value={assignedBranchId}
                      onChange={(e) => setAssignedBranchId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    >
                      <option value="">All Branches (General)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Gender (Optional)
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    >
                      <option value="">Not Specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT & LOCATION */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <div className="relative mt-1">
                      <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+257 71 23 45 67"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Physical Street / Delivery Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Boulevard du 1er Novembre, Rohero"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bujumbura"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Burundi"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Date of Birth (For Birthday Promotions & Greetings)
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FINANCIAL & NOTES */}
            {activeTab === 'financial' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Credit Limit (Allowed Unpaid Balance)
                  </label>
                  <div className="relative mt-1">
                    <CreditCard className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Set a maximum limit if this customer is allowed to purchase goods on credit at POS.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Internal Notes / Customer Preferences
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Prefers Arabica medium roast, wholesale deliveries on Friday mornings, calls before arrival..."
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: TAGS & SEGMENTATION */}
            {activeTab === 'tags' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Assign Tags
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                    Click tags to assign to this customer for easy filtering and targeted campaigns.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleTag(tag.id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold dark:border-brand-500 dark:bg-brand-950 dark:text-brand-300'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-950 dark:text-gray-300'
                          }`}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color || '#6366f1' }}
                          />
                          <span>#{tag.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add Tag Form */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-navy-800 dark:bg-navy-950/40">
                  <div className="text-xs font-bold text-navy-900 dark:text-white">Create New Tag on the fly</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="e.g. coffee_enthusiast"
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="h-9 w-9 rounded-xl border border-gray-200 p-1 cursor-pointer dark:border-navy-700 bg-white dark:bg-navy-900"
                    />
                    <button
                      type="button"
                      disabled={isCreatingTag || !newTagName.trim()}
                      onClick={handleCreateQuickTag}
                      className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-navy-800 dark:bg-navy-950/40">
            <div className="flex items-center gap-2">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'tags') setActiveTab('financial');
                    else if (activeTab === 'financial') setActiveTab('contact');
                    else if (activeTab === 'contact') setActiveTab('basic');
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
                >
                  Previous
                </button>
              )}
              {activeTab !== 'tags' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'basic') setActiveTab('contact');
                    else if (activeTab === 'contact') setActiveTab('financial');
                    else if (activeTab === 'financial') setActiveTab('tags');
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy-900 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                >
                  Next Step
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Customer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
