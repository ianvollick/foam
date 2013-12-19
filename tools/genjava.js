/**
 * @license
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Generates the java source for a model and writes it to a file.
 */
require('../core/bootFOAMnode.js');
var fs = require('fs');

var model = GLOBAL[process.argv[2]];
var outfile = process.argv[3];

model.create();
fs.writeFileSync(outfile, model.javaSource());
process.exit();
