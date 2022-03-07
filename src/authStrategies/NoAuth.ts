'use strict';

import { BaseAuthStrategy } from "./BaseAuthStrategy";

/**
 * No session restoring functionality
 * Will need to authenticate via QR code every time
*/
export class NoAuth extends BaseAuthStrategy { }
