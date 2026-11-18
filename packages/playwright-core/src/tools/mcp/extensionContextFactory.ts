/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { playwright } from '../../inprocess';
import { extensionHeaders } from '../../server/chromium/crExtensionRelay';

import type * as playwrightTypes from '../../..';

export type ExtensionBrowserOptions = {
  channel: string;
  executablePath?: string;
  userDataDir?: string;
  profileDirName?: string;
  clientName: string;
  // Undefined for a client without a tab group.
  tabGroup?: { title?: string, color?: string };
  background?: boolean;
};

export async function createExtensionBrowser(options: ExtensionBrowserOptions): Promise<playwrightTypes.Browser> {
  // The options of the extension connection go to the relay in the headers of connectOverCDP.
  const headers: Record<string, string> = {};
  const setHeader = (name: keyof typeof extensionHeaders, value: string | undefined) => {
    if (value)
      headers[extensionHeaders[name]] = value;
  };
  const token = process.env.PLAYWRIGHT_MCP_EXTENSION_TOKEN;
  setHeader('clientName', options.clientName);
  setHeader('token', token);
  setHeader('executablePath', options.executablePath);
  setHeader('userDataDir', options.userDataDir ?? process.env.PWTEST_EXTENSION_USER_DATA_DIR);
  setHeader('profileDirectory', options.profileDirName);
  setHeader('tabGroup', options.tabGroup ? undefined : 'false');
  setHeader('tabGroupTitle', options.tabGroup?.title);
  setHeader('tabGroupColor', options.tabGroup?.color);
  setHeader('background', options.background ? 'true' : undefined);
  // Without a token the user approves the connection in the browser, which has no time limit.
  const timeout = token ? +(process.env.PWTEST_EXTENSION_CONNECT_TIMEOUT ?? 30_000) : 0;
  return await playwright.chromium.connectOverCDP(`${options.channel}-extension`, { headers, timeout, noDefaults: true });
}
