export interface StreamerInfo {
  twitchId: string;
  twitchLogin: string;
  displayName: string;
  email: string | null;
  connectedAt: string | null;
  shopifyConnected: boolean;
  shopifyStoreDomain: string | null;
  shopifyApiVersion?: string | null;
}
