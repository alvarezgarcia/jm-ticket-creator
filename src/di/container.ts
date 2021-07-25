import 'reflect-metadata';
import { Container } from 'inversify'

import { DISymbols } from './symbols';

import { Imap } from '../infra/imap-server/imap';
import { Redmine } from '../infra/redmine-server/redmine';
import { CommonLogger } from '../infra/logger/common-logger';
import { TelegramLogger } from '../infra/logger/telegram-logger';

import { EmailRepository  } from '../infra/imap-server/repos/email';
import { EmailService } from '../app/email';
import { IssueRepository } from '../infra/redmine-server/repos/issue';
import { IssueService } from '../app/issue';

const container = new Container();

container
  .bind(DISymbols.ImapServer)
  .to(Imap)
  .inSingletonScope();

container
  .bind(DISymbols.RedmineServer)
  .to(Redmine)
  .inSingletonScope();

container.bind(DISymbols.EmailRepository).to(EmailRepository);
container.bind(DISymbols.EmailService).to(EmailService);

container.bind(DISymbols.IssueRepository).to(IssueRepository);
container.bind(DISymbols.IssueService).to(IssueService);

container
  .bind(DISymbols.CommonLogger)
  .to(CommonLogger)
  .inSingletonScope();

container
  .bind(DISymbols.TelegramLogger)
  .to(TelegramLogger)
  .inSingletonScope();


export { container };