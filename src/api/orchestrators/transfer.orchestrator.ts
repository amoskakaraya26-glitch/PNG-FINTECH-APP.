import TransferService, {
  QueryClient,
  TransferRequest,
  TransferResult,
} from '../services/transfer.service';

export class TransferOrchestrator {
  async execute(
    client: QueryClient,
    request: TransferRequest
  ): Promise<TransferResult> {
    return TransferService.transferMoney(client, request);
  }
}

export default new TransferOrchestrator();