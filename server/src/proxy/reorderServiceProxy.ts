import { List } from "../data/models/list";
import { IReorderService } from "../interface/iReorderService";
import { Logger } from "../logger/logger";

//PATTERN: Proxy
export class ReorderServiceProxy implements IReorderService {
  private reorderService: IReorderService;
  private logger: Logger;

  constructor(reorderService: IReorderService, logger: Logger) {
    this.reorderService = reorderService;
    this.logger = logger;
  }

  public reorder<T>(items: T[], startIndex: number, endIndex: number): T[] {
    this.logger.log('info', `reorder called with items: ${JSON.stringify(items)}, startIndex: ${startIndex}, endIndex: ${endIndex}`);
    return this.reorderService.reorder(items, startIndex, endIndex);
  }

  public reorderCards(params: {
    lists: List[];
    sourceIndex: number;
    destinationIndex: number;
    sourceListId: string;
    destinationListId: string;
  }): List[] {
    this.logger.log('info', `reorderCards called with params: ${JSON.stringify(params)}`);
    return this.reorderService.reorderCards(params);
  }
}