const CATEGORIES = ['electronics', 'keys', 'documents', 'books', 'clothing', 'bags', 'other'];
const FIELDS = ['name', 'description', 'category', 'found_location', 'found_at', 'is_claimed'];

function toMysqlDateTime(value) {
  const d = new Date(value);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function isNonEmptyString(v, max) {
  return typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
}


function validateItem(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], data };
  }

  for (const key of Object.keys(body)) {
    if (!FIELDS.includes(key)) errors.push(`Unknown field: ${key}`);
  }

  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (has('name')) {
    if (!isNonEmptyString(body.name, 100)) errors.push('name must be a non-empty string (max 100 characters)');
    else data.name = body.name.trim();
  } else if (!partial) errors.push('name is required');

  if (has('description')) {
    if (body.description !== null && typeof body.description !== 'string') errors.push('description must be a string or null');
    else if (typeof body.description === 'string' && body.description.length > 5000) errors.push('description is too long (max 5000 characters)');
    else data.description = body.description === null ? null : body.description.trim();
  }

  if (has('category')) {
    if (!CATEGORIES.includes(body.category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
    else data.category = body.category;
  }

  if (has('found_location')) {
    if (!isNonEmptyString(body.found_location, 150)) errors.push('found_location must be a non-empty string (max 150 characters)');
    else data.found_location = body.found_location.trim();
  } else if (!partial) errors.push('found_location is required');

  if (has('found_at')) {
    const d = typeof body.found_at === 'string' ? new Date(body.found_at) : null;
    if (!d || Number.isNaN(d.getTime())) errors.push('found_at must be a valid date string, e.g. 2026-11-05T10:30:00Z');
    else if (d.getTime() > Date.now() + 60 * 1000) errors.push('found_at cannot be in the future');
    else data.found_at = toMysqlDateTime(body.found_at);
  } else if (!partial) errors.push('found_at is required');

  if (has('is_claimed')) {
    if (typeof body.is_claimed !== 'boolean') errors.push('is_claimed must be true or false');
    else data.is_claimed = body.is_claimed;
  }

  if (partial && Object.keys(body).length === 0) errors.push('Provide at least one field to update');

  return { errors, data };
}

export { validateItem, FIELDS, CATEGORIES };