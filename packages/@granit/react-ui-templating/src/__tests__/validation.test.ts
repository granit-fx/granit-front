import { templateFormSchema } from '../validation';

describe('templateFormSchema', () => {
  const validData = {
    name: 'Billing.Invoice',
    content: '<h1>{{ model.title }}</h1>',
    mimeType: 'text/html',
  };

  it('should accept valid template data', () => {
    const result = templateFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept a name with multiple segments', () => {
    const result = templateFormSchema.safeParse({
      ...validData,
      name: 'Billing.Invoice.Reminder',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional culture and categoryId', () => {
    const result = templateFormSchema.safeParse({
      ...validData,
      culture: 'fr',
      categoryId: 'cat-1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject a name with a single segment', () => {
    const result = templateFormSchema.safeParse({ ...validData, name: 'Invoice' });
    expect(result.success).toBe(false);
  });

  it('should reject a name without dot separator', () => {
    const result = templateFormSchema.safeParse({ ...validData, name: 'BillingInvoice' });
    expect(result.success).toBe(false);
  });

  it('should reject a name starting with lowercase', () => {
    const result = templateFormSchema.safeParse({ ...validData, name: 'billing.Invoice' });
    expect(result.success).toBe(false);
  });

  it('should reject empty content', () => {
    const result = templateFormSchema.safeParse({ ...validData, content: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing mimeType', () => {
    const result = templateFormSchema.safeParse({
      name: 'Billing.Invoice',
      content: '<p>test</p>',
    });
    expect(result.success).toBe(false);
  });
});
