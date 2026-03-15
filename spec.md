# ChallanPay

## Current State
App allows vehicle challan lookup (demo data), UPI payment with UTR submission, and admin panel at `/#/Srikant` with PIN `admin123`. Admin can manage UPI ID, support number, and payment requests.

## Requested Changes (Diff)

### Add
- `apiKey` and `apiBaseUrl` fields in backend storage (getter/setter functions)
- API Configuration section in admin panel (API Base URL + API Key inputs)
- Frontend logic: when a user searches, if API is configured (apiKey + apiBaseUrl set), make a live HTTP fetch to the external API; if not configured, fall back to demo/local data

### Modify
- `getChallansByVehicle` lookup flow in App.tsx to check API config first, then fall back to backend demo data

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo` to add `setApiConfig`, `getApiConfig` functions storing `apiKey` and `apiBaseUrl`
2. Regenerate `backend.d.ts` with new interface methods
3. Add `useGetApiConfig` and `useSetApiConfig` hooks to `useQueries.ts`
4. Add "API Configuration" section to `AdminPanel.tsx` with Base URL + API Key inputs
5. Update `App.tsx` challan search to fetch from external API if configured, else use local data
