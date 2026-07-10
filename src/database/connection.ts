import dotenv from 'dotenv';
dotenv.config();


import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config/default';

type QueryRow = Record<string, any>;

type MockQueryResult = QueryResult<any>;

class InMemoryClient {
  constructor(private db: InMemoryDatabase) {}

  async query(text: string, params: any[] = []): Promise<MockQueryResult> {
    return this.db.query(text, params);
  }

  release() {
    return;
  }
}

class InMemoryDatabase {
  private users = new Map<string, QueryRow>();
  private wallets = new Map<string, QueryRow>();
  private transactions = new Map<string, QueryRow>();
  private userLimits = new Map<string, QueryRow>();
  private referrals = new Map<string, QueryRow>();
  private bankAccounts = new Map<string, QueryRow>();
  private contacts = new Map<string, QueryRow>();
  private notifications = new Map<string, QueryRow>();
  private bills = new Map<string, QueryRow>();
  private disputes = new Map<string, QueryRow>();

  private buildResult(rows: QueryRow[], command = 'SELECT'): MockQueryResult {
    return {
      command,
      rowCount: rows.length,
      oid: 0,
      fields: [],
      rows,
    };
  }

  async query(text: string, params: any[] = []): Promise<MockQueryResult> {
    const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();

    if (/^begin$/.test(normalized)) {
      return this.buildResult([], 'BEGIN');
    }

    if (/^commit$/.test(normalized)) {
      return this.buildResult([], 'COMMIT');
    }

    if (/^rollback$/.test(normalized)) {
      return this.buildResult([], 'ROLLBACK');
    }

    if (/^select id from users where phone = \$1/i.test(normalized)) {
      const user = Array.from(this.users.values()).find((candidate) => candidate.phone === params[0]);
      return this.buildResult(user ? [{ id: user.id }] : [], 'SELECT');
    }

    if (/^select id from users where referral_code = \$1/i.test(normalized)) {
      const user = Array.from(this.users.values()).find((candidate) => candidate.referral_code === params[0]);
      return this.buildResult(user ? [{ id: user.id }] : [], 'SELECT');
    }

    if (/^insert into users/i.test(normalized)) {
      const [id, phone, fullName, pinHash, referralCode, referredBy] = params;
      const user = {
        id,
        phone,
        full_name: fullName,
        pin_hash: pinHash,
        referral_code: referralCode,
        referred_by: referredBy || null,
        is_admin: false,
        kyc_status: 'pending',
        onboarding_completed: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.users.set(id, user);
      return this.buildResult([user], 'INSERT');
    }

    if (/^insert into wallets/i.test(normalized)) {
      const [id, userId, balanceOrCurrency, currencyOrStatus, maybeStatus] = params;
      const usesLiteralBalance = params.length === 3;
      const wallet = {
        id,
        user_id: userId,
        balance: usesLiteralBalance ? '0' : balanceOrCurrency.toString(),
        currency: usesLiteralBalance ? balanceOrCurrency : currencyOrStatus,
        status: usesLiteralBalance ? 'active' : maybeStatus,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.wallets.set(id, wallet);
      return this.buildResult([wallet], 'INSERT');
    }

    if (/^select \* from wallets where id = \$1/i.test(normalized)) {
      const wallet = this.wallets.get(params[0]);
      return this.buildResult(wallet ? [wallet] : [], 'SELECT');
    }

    if (/^select \* from wallets where user_id = \$1 limit 1/i.test(normalized)) {
      const wallet = Array.from(this.wallets.values()).find((w) => w.user_id === params[0]);
      return this.buildResult(wallet ? [wallet] : [], 'SELECT');
    }

    if (/^select \* from wallets where user_id = \$1/i.test(normalized)) {
      const rows = Array.from(this.wallets.values()).filter((wallet) => wallet.user_id === params[0]);
      return this.buildResult(rows, 'SELECT');
    }

    if (/^select w\.\* from wallets w where w\.user_id = \$1/i.test(normalized)) {
      const rows = Array.from(this.wallets.values()).filter((wallet) => wallet.user_id === params[0]);
      return this.buildResult(rows, 'SELECT');
    }

    if (/^select \* from wallets where id = \$1 for update/i.test(normalized)) {
      const wallet = this.wallets.get(params[0]);
      return this.buildResult(wallet ? [wallet] : [], 'SELECT');
    }

    if (/^update wallets set balance = \$1, updated_at = now\(\) where id = \$2/i.test(normalized)) {
      const [balance, id] = params;
      const wallet = this.wallets.get(id);
      if (!wallet) {
        return this.buildResult([], 'UPDATE');
      }
      wallet.balance = balance.toString();
      wallet.updated_at = new Date();
      this.wallets.set(id, wallet);
      return this.buildResult([wallet], 'UPDATE');
    }

    if (/^update wallets set balance = balance - \$1, updated_at=now\(\) where user_id = \$2/i.test(normalized)) {
      const [amount, userId] = params;
      const wallet = Array.from(this.wallets.values()).find((candidate) => candidate.user_id === userId);
      if (!wallet) {
        return this.buildResult([], 'UPDATE');
      }

      wallet.balance = (parseFloat(wallet.balance) - parseFloat(amount)).toString();
      wallet.updated_at = new Date();
      this.wallets.set(wallet.id, wallet);
      return this.buildResult([wallet], 'UPDATE');
    }

    if (/^update wallets set balance = balance \+ \$1, updated_at=now\(\) where user_id = \$2/i.test(normalized)) {
      const [amount, userId] = params;
      const wallet = Array.from(this.wallets.values()).find((candidate) => candidate.user_id === userId);
      if (!wallet) {
        return this.buildResult([], 'UPDATE');
      }

      wallet.balance = (parseFloat(wallet.balance) + parseFloat(amount)).toString();
      wallet.updated_at = new Date();
      this.wallets.set(wallet.id, wallet);
      return this.buildResult([wallet], 'UPDATE');
    }

    if (/^select \* from wallets where id in \(\$1, \$2\) for update/i.test(normalized)) {
      const wallets = [params[0], params[1]]
        .map((id) => this.wallets.get(id))
        .filter((wallet): wallet is QueryRow => Boolean(wallet));
      return this.buildResult(wallets, 'SELECT');
    }

    if (/^update wallets set balance = case when id = \$1 then \$2 when id = \$3 then \$4 end, updated_at = now\(\) where id in \(\$1, \$3\)/i.test(normalized)) {
      const [fromId, fromBalance, toId, toBalance] = params;
      const fromWallet = this.wallets.get(fromId);
      const toWallet = this.wallets.get(toId);
      if (fromWallet) {
        fromWallet.balance = fromBalance.toString();
        fromWallet.updated_at = new Date();
        this.wallets.set(fromId, fromWallet);
      }
      if (toWallet) {
        toWallet.balance = toBalance.toString();
        toWallet.updated_at = new Date();
        this.wallets.set(toId, toWallet);
      }
      return this.buildResult(
        [fromWallet, toWallet].filter((wallet): wallet is QueryRow => Boolean(wallet)),
        'UPDATE'
      );
    }

    if (/^insert into transactions/i.test(normalized)) {
      const [id, walletId, type, amount, currency, status, description, senderId, receiverId, category] = params;
      const transaction = {
        id,
        wallet_id: walletId,
        type,
        amount: amount.toString(),
        currency,
        status,
        description: description || null,
        sender_id: senderId || null,
        receiver_id: receiverId || null,
        category: category || null,
        created_at: new Date(),
      };
      this.transactions.set(id, transaction);
      return this.buildResult([transaction], 'INSERT');
    }

    if (/^insert into user_limits/i.test(normalized)) {
      const [id, userId] = params;
      const userLimit = {
        id,
        user_id: userId,
        daily_send_limit: '1000',
        daily_receive_limit: '5000',
        monthly_send_limit: '10000',
        monthly_receive_limit: '50000',
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.userLimits.set(id, userLimit);
      return this.buildResult([userLimit], 'INSERT');
    }

    if (/^insert into referrals/i.test(normalized)) {
      const [id, referrerId, referredId] = params;
      const referral = {
        id,
        referrer_id: referrerId,
        referred_id: referredId,
        status: 'pending',
        created_at: new Date(),
      };
      this.referrals.set(id, referral);
      return this.buildResult([referral], 'INSERT');
    }

    if (/^insert into bank_accounts/i.test(normalized)) {
      const [id, userId, bankCode, accountNumber, accountName, status] = params;
      const account = {
        id,
        user_id: userId,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        status: status || 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.bankAccounts.set(id, account);
      return this.buildResult([account], 'INSERT');
    }

    if (/^select \* from bank_accounts where user_id=\$1/i.test(normalized)) {
      const rows = Array.from(this.bankAccounts.values()).filter((account) => account.user_id === params[0]);
      return this.buildResult(rows, 'SELECT');
    }

    if (/^select \* from bank_accounts where id=\$1 and user_id=\$2/i.test(normalized)) {
      const account = this.bankAccounts.get(params[0]);
      if (account && account.user_id === params[1]) {
        return this.buildResult([account], 'SELECT');
      }
      return this.buildResult([], 'SELECT');
    }

    if (/^select \* from users where phone = \$1 and is_active = true/i.test(normalized)) {
      const user = Array.from(this.users.values()).find(
        (candidate) => candidate.phone === params[0] && candidate.is_active === true
      );
      return this.buildResult(user ? [user] : [], 'SELECT');
    }

    if (/^select referral_code from users where id=\$1/i.test(normalized)) {
      const user = this.users.get(params[0]);
      return this.buildResult(user ? [{ referral_code: user.referral_code }] : [], 'SELECT');
    }

    if (/^select u\.id, u\.full_name, w\.id as wallet_id from users u join wallets w on w\.user_id = u\.id where u\.phone = \$1/i.test(normalized)) {
      const user = Array.from(this.users.values()).find((candidate) => candidate.phone === params[0]);
      if (!user) {
        return this.buildResult([], 'SELECT');
      }

      const wallet = Array.from(this.wallets.values()).find((candidate) => candidate.user_id === user.id);
      if (!wallet) {
        return this.buildResult([], 'SELECT');
      }

      return this.buildResult([{
        id: user.id,
        full_name: user.full_name,
        wallet_id: wallet.id,
      }], 'SELECT');
    }

    if (/^select pin_hash from users where id = \$1/i.test(normalized)) {
      const user = this.users.get(params[0]);
      return this.buildResult(user ? [{ pin_hash: user.pin_hash }] : [], 'SELECT');
    }

    if (/^select u\.\*, w\.balance, w\.currency from users u left join wallets w on w\.user_id = u\.id where u\.id = \$1/i.test(normalized)) {
      const user = this.users.get(params[0]);
      if (!user) {
        return this.buildResult([], 'SELECT');
      }

      const wallet = Array.from(this.wallets.values()).find((candidate) => candidate.user_id === params[0]);
      return this.buildResult(
        [{
          ...user,
          balance: wallet?.balance ?? '0',
          currency: wallet?.currency ?? 'PGK',
        }],
        'SELECT'
      );
    }

    if (/^update users set full_name=\$1, email=\$2, date_of_birth=\$3, address=\$4, province=\$5, updated_at=now\(\) where id=\$6/i.test(normalized)) {
      const [fullName, email, dateOfBirth, address, province, id] = params;
      const user = this.users.get(id);
      if (!user) {
        return this.buildResult([], 'UPDATE');
      }

      Object.assign(user, {
        full_name: fullName,
        email,
        date_of_birth: dateOfBirth,
        address,
        province,
        updated_at: new Date(),
      });
      this.users.set(id, user);
      return this.buildResult([user], 'UPDATE');
    }

    if (/^update users set pin_hash=\$1, updated_at=now\(\) where id=\$2/i.test(normalized)) {
      const [pinHash, id] = params;
      const user = this.users.get(id);
      if (!user) {
        return this.buildResult([], 'UPDATE');
      }

      user.pin_hash = pinHash;
      user.updated_at = new Date();
      this.users.set(id, user);
      return this.buildResult([user], 'UPDATE');
    }

    if (/^update users set onboarding_completed=true where id=\$1/i.test(normalized)) {
      const user = this.users.get(params[0]);
      if (!user) {
        return this.buildResult([], 'UPDATE');
      }

      user.onboarding_completed = true;
      user.updated_at = new Date();
      this.users.set(params[0], user);
      return this.buildResult([user], 'UPDATE');
    }

    if (/^select \* from user_limits where user_id = \$1/i.test(normalized)) {
      const rows = Array.from(this.userLimits.values()).filter((limit) => limit.user_id === params[0]);
      return this.buildResult(rows, 'SELECT');
    }

    if (/^insert into notifications/i.test(normalized)) {
      const [id, userId, type, title, message, data] = params;
      const notification = {
        id,
        user_id: userId,
        type,
        title,
        message,
        data: data || null,
        is_read: false,
        created_at: new Date(),
      };
      this.notifications.set(id, notification);
      return this.buildResult([notification], 'INSERT');
    }

    if (/^select \* from notifications where user_id = \$1 order by created_at desc limit 50/i.test(normalized)) {
      const rows = Array.from(this.notifications.values())
        .filter((notification) => notification.user_id === params[0])
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, 50);
      return this.buildResult(rows, 'SELECT');
    }

    if (/^update notifications set is_read=true where user_id=\$1/i.test(normalized)) {
      const rows = Array.from(this.notifications.values()).filter((notification) => notification.user_id === params[0]);
      rows.forEach((notification) => {
        notification.is_read = true;
        this.notifications.set(notification.id, notification);
      });
      return this.buildResult(rows, 'UPDATE');
    }

    if (/^update notifications set is_read=true where id=\$1 and user_id=\$2/i.test(normalized)) {
      const notification = this.notifications.get(params[0]);
      if (notification && notification.user_id === params[1]) {
        notification.is_read = true;
        this.notifications.set(notification.id, notification);
        return this.buildResult([notification], 'UPDATE');
      }
      return this.buildResult([], 'UPDATE');
    }

    if (/^select count\(\*\) as count from notifications where user_id=\$1 and is_read=false/i.test(normalized)) {
      const count = Array.from(this.notifications.values()).filter(
        (notification) => notification.user_id === params[0] && notification.is_read === false
      ).length;
      return this.buildResult([{ count: String(count) }], 'SELECT');
    }

    if (/^select c\.\*, u\.full_name as registered_name, u\.avatar_url from contacts c left join users u on u\.id = c\.contact_user_id where c\.user_id = \$1 order by c\.is_favorite desc, c\.name/i.test(normalized)) {
      const rows = Array.from(this.contacts.values())
        .filter((contact) => contact.user_id === params[0])
        .sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || String(a.name).localeCompare(String(b.name)))
        .map((contact) => {
          const registeredUser = contact.contact_user_id ? this.users.get(contact.contact_user_id) : null;
          return {
            ...contact,
            registered_name: registeredUser?.full_name || null,
            avatar_url: registeredUser?.avatar_url || null,
          };
        });
      return this.buildResult(rows, 'SELECT');
    }

    if (/^insert into contacts/i.test(normalized)) {
      const [id, userId, contactUserId, name, phone] = params;
      const contact = {
        id,
        user_id: userId,
        contact_user_id: contactUserId,
        name,
        phone,
        is_favorite: false,
        created_at: new Date(),
      };
      this.contacts.set(id, contact);
      return this.buildResult([contact], 'INSERT');
    }

    if (/^update contacts set is_favorite = not is_favorite where id=\$1 and user_id=\$2/i.test(normalized)) {
      const contact = this.contacts.get(params[0]);
      if (contact && contact.user_id === params[1]) {
        contact.is_favorite = !contact.is_favorite;
        this.contacts.set(contact.id, contact);
        return this.buildResult([contact], 'UPDATE');
      }
      return this.buildResult([], 'UPDATE');
    }

    if (/^delete from contacts where id=\$1 and user_id=\$2/i.test(normalized)) {
      const contact = this.contacts.get(params[0]);
      if (contact && contact.user_id === params[1]) {
        this.contacts.delete(params[0]);
        return this.buildResult([contact], 'DELETE');
      }
      return this.buildResult([], 'DELETE');
    }

    if (/^insert into bills/i.test(normalized)) {
      const [id, userId, billerName, billerCode, accountNumber, billType, amount] = params;
      const bill = {
        id,
        user_id: userId,
        biller_name: billerName,
        biller_code: billerCode,
        account_number: accountNumber,
        bill_type: billType,
        amount: amount.toString(),
        status: 'paid',
        paid_at: new Date(),
        created_at: new Date(),
      };
      this.bills.set(id, bill);
      return this.buildResult([bill], 'INSERT');
    }

    if (/^select \* from bills where user_id=\$1 order by created_at desc/i.test(normalized)) {
      const rows = Array.from(this.bills.values())
        .filter((bill) => bill.user_id === params[0])
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return this.buildResult(rows, 'SELECT');
    }

    if (/^insert into disputes/i.test(normalized)) {
      const [id, userId, transactionId, type, subject, description] = params;
      const dispute = {
        id,
        user_id: userId,
        transaction_id: transactionId,
        type,
        subject,
        description,
        status: 'open',
        created_at: new Date(),
      };
      this.disputes.set(id, dispute);
      return this.buildResult([dispute], 'INSERT');
    }

    if (/^select \* from disputes where user_id=\$1 order by created_at desc/i.test(normalized)) {
      const rows = Array.from(this.disputes.values())
        .filter((dispute) => dispute.user_id === params[0])
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return this.buildResult(rows, 'SELECT');
    }

    if (/^select \* from transactions/i.test(normalized)) {
      const walletId = params[0];
      const rows = Array.from(this.transactions.values())
        .filter((tx) => tx.wallet_id === walletId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return this.buildResult(rows, 'SELECT');
    }

    if (/^select t\.\*, s\.full_name as sender_name, s\.phone as sender_phone, r\.full_name as receiver_name, r\.phone as receiver_phone from transactions t left join users s on s\.id = t\.sender_id left join users r on r\.id = t\.receiver_id join wallets w on w\.id = t\.wallet_id where w\.user_id = \$1/i.test(normalized)) {
      const walletIds = new Set(
        Array.from(this.wallets.values())
          .filter((wallet) => wallet.user_id === params[0])
          .map((wallet) => wallet.id)
      );
      let rows = Array.from(this.transactions.values()).filter((transaction) => walletIds.has(transaction.wallet_id));

      if (params.length >= 4 && params[1] && typeof params[1] === 'string') {
        rows = rows.filter((transaction) => transaction.type === params[1]);
      }

      rows = rows
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, Number(params[params.length - 2] || rows.length));

      return this.buildResult(rows.map((transaction) => ({
        ...transaction,
        sender_name: transaction.sender_id ? this.users.get(transaction.sender_id)?.full_name || null : null,
        sender_phone: transaction.sender_id ? this.users.get(transaction.sender_id)?.phone || null : null,
        receiver_name: transaction.receiver_id ? this.users.get(transaction.receiver_id)?.full_name || null : null,
        receiver_phone: transaction.receiver_id ? this.users.get(transaction.receiver_id)?.phone || null : null,
      })), 'SELECT');
    }

    throw new Error(`Unsupported test query: ${text}`);
  }

  async getClient(): Promise<InMemoryClient> {
    return new InMemoryClient(this);
  }
}

export class Database {
  private pool?: Pool;
  private memoryDb?: InMemoryDatabase;
  private useInMemory = process.env.NODE_ENV === 'test';

  constructor() {

    console.log('DATABASE DEBUG:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      passwordLength: process.env.DB_PASSWORD?.length,
      nodeEnv: process.env.NODE_ENV
    });

    if (this.useInMemory) {
      this.memoryDb = new InMemoryDatabase();
      return;
    }

    // Support DATABASE_URL (Neon, Supabase, Heroku, Render, etc.)
    const poolConfig = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        }
      : {
          host: process.env.DB_HOST || config.database.host,
          port: parseInt(process.env.DB_PORT || config.database.port.toString()),
          database: process.env.DB_NAME || config.database.name,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        };

    this.pool = new Pool(poolConfig as any);

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async query(text: string, params: any[] = []): Promise<QueryResult<any>> {
    if (this.useInMemory) {
      return this.memoryDb!.query(text, params);
    }

    const start = Date.now();
    try {
      const res = await this.pool!.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (err: any) {
      console.error('Query error', { text, err });

      const rootError = err?.code ? err : err?.errors?.[0] || err;
      const rootMessage = String(rootError?.message || '');
      const isRecoverableConnectionError = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', '28P01', '3D000']
        .includes(rootError?.code) ||
        /econnrefused|password authentication failed|database .* does not exist|getaddrinfo/i.test(rootMessage);

      if (process.env.NODE_ENV !== 'production' && isRecoverableConnectionError) {
        console.warn(`Postgres unavailable for local runtime (${rootMessage || rootError?.code}). Falling back to in-memory database store.`);
        this.useInMemory = true;
        this.memoryDb = new InMemoryDatabase();
        return this.memoryDb.query(text, params);
      }

      throw err;
    }
  }

  async getClient(): Promise<PoolClient | InMemoryClient> {
    if (this.useInMemory) {
      return this.memoryDb!.getClient();
    }
    return this.pool!.connect();
  }

  // Alias for connect() — used by controllers that do pool.connect()
  async connect(): Promise<PoolClient | InMemoryClient> {
    return this.getClient();
  }

  async close() {
    if (this.useInMemory) {
      return;
    }
    await this.pool!.end();
  }
}

export const db = new Database();
export default db;