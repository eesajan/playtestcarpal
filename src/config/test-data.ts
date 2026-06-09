export const DEFAULT_VEHICLE_DATA = {
  client: "Test",
  brand: "Acura",
  model: "CL",
  modelYear: "2027",
  plateNumber: "1234",
  mileage: "123",
  color: "yellow",
  country: "Pakistan",
  countrySearch: "pak",
  citySearch: "islamabad",
  cityResult: "Islamabad",
  remarks: "Created by Playwright automation",
} as const;

export const DEFAULT_CASE_DATA = {
  customerCountryCode: "PAK",
  reportedIssueSource: "CSA",
} as const;

export const GEOLOCATION = {
  islamabad: { latitude: 33.6844, longitude: 73.0479 },
} as const;
