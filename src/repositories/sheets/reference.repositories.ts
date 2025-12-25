// Simple read-only implementations for reference data (Cities, Districts, ISPs)
// These can use the same in-memory implementation or be loaded from dedicated sheets

export { InMemoryCityRepository as SheetsCityRepository } from '../city.repository';
export { InMemoryDistrictRepository as SheetsDistrictRepository } from '../district.repository';
export { InMemoryISPRepository as SheetsISPRepository } from '../isp.repository';
