import type { RuleModule } from "../types.js";
import { qual001 } from "./qual-001.js";
import { qual002 } from "./qual-002.js";
import { qual003 } from "./qual-003.js";
import { sec001 } from "./sec-001.js";
import { sec002 } from "./sec-002.js";
import { sec003a } from "./sec-003a.js";
import { sec003b } from "./sec-003b.js";
import { sec004 } from "./sec-004.js";
import { sec005 } from "./sec-005.js";
import { sec006 } from "./sec-006.js";

export const rules: RuleModule[] = [sec003a, sec003b, sec001, sec005, qual001, sec002, sec004, qual002, qual003, sec006];
