/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                       [COMPONENT/FILE NAME HERE]                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * FILE LOCATION:
 *   src/[path]/[filename].jsx
 *
 * PARENT COMPONENTS:
 *   - [ParentComponent].jsx (src/[path]/[ParentComponent].jsx)
 *     └─> How it uses this component (e.g., renders it, calls functions, etc.)
 *
 *   - [AnotherParent].jsx (src/[path]/[AnotherParent].jsx)
 *     └─> Another way it's used
 *
 * CALLED/TRIGGERED FROM:
 *   1. [Component/File].jsx → [Function/Event]
 *      Triggered by: [User action or system event]
 *      Example: User clicking button, API response, timer, etc.
 *
 *   2. [Another Source] → [Event name]
 *      Triggered by: [Description]
 *
 *   3. [Global Event] → Custom event 'event-name'
 *      Triggered by: window.dispatchEvent(new CustomEvent('event-name'))
 *
 * HOW TO USE THIS COMPONENT:
 *   ```javascript
 *   // Method 1: [Description of primary usage]
 *   import { ComponentName } from './path/to/ComponentName'
 *
 *   <ComponentName
 *     prop1={value1}
 *     prop2={value2}
 *     onEvent={handleEvent}
 *   />
 *
 *   // Method 2: [Alternative usage pattern if applicable]
 *   const { helperFunction } = useHook()
 *   helperFunction()
 *   ```
 *
 * HOW TO MODIFY/EXTEND:
 *   1. To add new feature X:
 *      - Step 1: [Specific instruction]
 *      - Step 2: [Specific instruction]
 *      - Step 3: [Specific instruction]
 *
 *   2. To change behavior Y:
 *      - Find the [function/section] around line [XX]
 *      - Modify [specific part]
 *      - Update [related state/prop]
 *
 * RELATED FILES:
 *   - [RelatedFile1].jsx - [What it does / how it's related]
 *   - [RelatedFile2].jsx - [What it does / how it's related]
 *   - [Context/Hook].js - [State management, utilities, etc.]
 *   - [Style].css - [Styling notes if applicable]
 *
 * DEPENDENCIES:
 *   External:
 *   - react - [Specific hooks used: useState, useEffect, etc.]
 *   - [package-name] - [What from this package is used]
 *
 *   Internal:
 *   - useCustomHook - [What it provides]
 *   - HelperUtility - [What it does]
 *
 * STATE MANAGEMENT:
 *   Local State:
 *   - [stateName]: [Type] - [Purpose/Description]
 *   - [anotherState]: [Type] - [Purpose/Description]
 *
 *   Global State (Context):
 *   - [contextValue]: [Type] - [From which context, what it controls]
 *
 *   Props:
 *   - [propName]: [Type] - [Required/Optional] - [Description]
 *
 * ARCHITECTURE NOTES:
 *   - [Note about design patterns used]
 *   - [Performance considerations]
 *   - [Why certain decisions were made]
 *   - [Z-index layers if UI component]
 *   - [Event flow if complex]
 *   - [Data flow diagram if needed]
 *
 * KNOWN ISSUES / TODOS:
 *   - [ ] [Issue #1 description]
 *   - [ ] [TODO #1 description]
 *   - [x] [Completed item for reference]
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * [ComponentName] Component
 *
 * [One paragraph description of what this component does]
 *
 * [Second paragraph about key features or important behavior]
 *
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 *
 * @component
 * @param {Object} props - Component props
 * @param {Type} props.propName - Description of prop
 * @param {Type} props.anotherProp - Description
 *
 * @returns {JSX.Element} [What it renders]
 *
 * @example
 * // Basic usage
 * <ComponentName propName={value} />
 *
 * @example
 * // Advanced usage with all options
 * <ComponentName
 *   propName={value}
 *   optional={true}
 *   onEvent={(data) => console.log(data)}
 * />
 */
