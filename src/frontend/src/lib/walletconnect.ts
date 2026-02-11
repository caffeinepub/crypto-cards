const WALLETCONNECT_PROJECT_ID = 'a01e2fcef3c6f06f6e8c87c4e0c8e8e8'; // Public project ID for demo

export interface WalletConnectConfig {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export interface WalletConnectSession {
  topic: string;
  accounts: string[];
  chainId: number;
}

class WalletConnectClient {
  private client: any = null;
  private session: any = null;
  private config: WalletConnectConfig;

  constructor(config: WalletConnectConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.client) return;

    try {
      // Dynamically import SignClient at runtime only
      const SignClientModule = await (Function('return import("@walletconnect/sign-client")')() as Promise<any>);
      const SignClient = SignClientModule.default || SignClientModule;
      
      this.client = await SignClient.init({
        projectId: this.config.projectId,
        metadata: this.config.metadata,
      });

      // Restore existing session if available
      const sessions = this.client.session.getAll();
      if (sessions.length > 0) {
        this.session = sessions[sessions.length - 1];
        console.log('[WalletConnect] Restored session:', this.session.topic);
      }
    } catch (error) {
      console.error('[WalletConnect] Failed to initialize:', error);
      throw error;
    }
  }

  async connect(chainId: number = 8453): Promise<{ uri: string; approval: () => Promise<any> }> {
    if (!this.client) {
      throw new Error('WalletConnect client not initialized');
    }

    try {
      const { uri, approval } = await this.client.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
            ],
            chains: [`eip155:${chainId}`],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      if (!uri) {
        throw new Error('Failed to generate WalletConnect URI');
      }

      console.log('[WalletConnect] Connection URI generated:', uri);

      return {
        uri,
        approval: async () => {
          const session = await approval();
          this.session = session;
          console.log('[WalletConnect] Session approved:', session.topic);
          return session;
        },
      };
    } catch (error) {
      console.error('[WalletConnect] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client || !this.session) {
      console.log('[WalletConnect] No active session to disconnect');
      return;
    }

    try {
      await this.client.disconnect({
        topic: this.session.topic,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      });
      this.session = null;
      console.log('[WalletConnect] Disconnected successfully');
    } catch (error) {
      console.error('[WalletConnect] Disconnect failed:', error);
      throw error;
    }
  }

  getSession(): WalletConnectSession | null {
    if (!this.session) return null;

    const accounts = this.session.namespaces.eip155?.accounts || [];
    const address = accounts[0]?.split(':')[2];
    const chainId = parseInt(accounts[0]?.split(':')[1] || '8453');

    return {
      topic: this.session.topic,
      accounts: address ? [address] : [],
      chainId,
    };
  }

  async request(method: string, params: any[]): Promise<any> {
    if (!this.client || !this.session) {
      throw new Error('No active WalletConnect session');
    }

    try {
      const chainId = this.getSession()?.chainId || 8453;
      const result = await this.client.request({
        topic: this.session.topic,
        chainId: `eip155:${chainId}`,
        request: {
          method,
          params,
        },
      });
      return result;
    } catch (error) {
      console.error('[WalletConnect] Request failed:', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balanceHex = await this.request('eth_getBalance', [address, 'latest']);
      const balanceWei = parseInt(balanceHex, 16);
      const balanceEth = (balanceWei / 1e18).toFixed(4);
      return balanceEth;
    } catch (error) {
      console.error('[WalletConnect] Failed to fetch balance:', error);
      return '0.0000';
    }
  }

  isConnected(): boolean {
    return this.session !== null;
  }
}

let walletConnectInstance: WalletConnectClient | null = null;

export function getWalletConnectClient(config?: WalletConnectConfig): WalletConnectClient {
  if (!walletConnectInstance) {
    const defaultConfig: WalletConnectConfig = {
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'Crypto Cards',
        description: 'Play Spades and Pot Limit Omaha with crypto',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://cryptocards.app',
        icons: [
          typeof window !== 'undefined'
            ? `${window.location.origin}/assets/generated/wallet-icon-transparent.dim_64x64.png`
            : 'https://cryptocards.app/assets/generated/wallet-icon-transparent.dim_64x64.png',
        ],
      },
    };
    walletConnectInstance = new WalletConnectClient(config || defaultConfig);
  }
  return walletConnectInstance;
}

export function resetWalletConnectClient(): void {
  walletConnectInstance = null;
}
