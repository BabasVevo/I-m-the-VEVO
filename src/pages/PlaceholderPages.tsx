import { PagePlaceholder } from '@/components/PagePlaceholder';
import type { NavItem } from '@/lib/constants';

export function PlaceholderPages({ item }: { item: NavItem }) {
  const descriptions: Record<string, string> = {
    '/pos': 'Process sales, search products, and accept payments at the point of sale.',
    '/cash-register': 'Open and close cash registers, track cash flow, and reconcile balances.',
    '/sales': 'Browse all sales and receipts, filter by date or branch, and process refunds.',
    '/products': 'Create and manage your product catalog with SKUs, pricing, and images.',
    '/categories': 'Organize products into categories for easy browsing and reporting.',
    '/stock': 'Monitor stock levels, adjust quantities, and transfer between branches.',
    '/purchases': 'Create purchase orders, receive stock, and track supplier deliveries.',
    '/customers': 'Manage customer profiles, view purchase history, and track engagement.',
    '/segments': 'Create automatic and manual customer segments for targeted marketing.',
    '/campaigns': 'Create and track marketing campaigns across WhatsApp, SMS, and email.',
    '/promotions': 'Set up percentage, fixed, and buy-one-get-one promotions.',
    '/coupons': 'Generate coupon codes, set usage limits, and track redemptions.',
    '/messages': 'Send and schedule marketing messages through configured providers.',
    '/automation': 'Build visual automation flows with triggers, delays, and actions.',
    '/suppliers': 'Manage supplier contacts and track purchase relationships.',
    '/expenses': 'Record and categorize business expenses by branch and category.',
    '/reports': 'Generate detailed reports for sales, inventory, expenses, and more.',
    '/analytics': 'Advanced analytics across sales, marketing, and branch performance.',
    '/branches': 'Manage multiple branches, each with its own inventory and staff.',
    '/staff': 'Manage employees, assign roles, and control permissions.',
    '/roles': 'Configure roles and granular permissions for your team.',
    '/notifications': 'View system alerts, stock warnings, and campaign updates.',
    '/plans': 'Manage your subscription plan and billing details.',
  };

  return (
    <PagePlaceholder
      title={item.label}
      description={descriptions[item.path] ?? 'This module will be available in an upcoming phase.'}
      icon={<item.icon className="h-8 w-8" />}
    />
  );
}
