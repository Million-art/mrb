export type FormData = {
  // Step 1: Basic Info
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  dateOfBirth: string;
  ipAddress: string;
  
  // Step 2: Address
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateProvinceRegion: string;
    country: string;
    postalCode: string;
  };
  
  // Step 3: Identity
  identityDocument: {
    idDocCountry: string;
    idDocType: string;
    idDocNumber: string;
    idDocFrontFile: File | null;
    idDocBackFile: File | null;
    idDocFrontPreview: string;
    idDocBackPreview: string;
  };
  
  // Step 4: Additional Info
  taxId?: string;
};