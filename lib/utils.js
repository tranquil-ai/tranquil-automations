const { registeredCommands } = require("./constants.js");

// Run eval output and create logs for Tranquil Automations terminal
const getEvalOutput = (code) => {
  // Create a variable to capture console.log outputs
  const logOutput = [];

  // Temporarily override console.log
  const originalLog = console.log;
  console.log = function (...args) {
    const logOutputinline = [];
    args.forEach((item) => {
      logOutputinline.push(item);
    });
    console.info(...logOutputinline); // log to console as well
    logOutput.push(logOutputinline.join(" "));
  };

  // Run the eval with the provided code
  eval(code);

  // Restore the original console.log
  console.log = originalLog;

  // Return the captured logs as a string or array
  return logOutput.join("`n");
};

// Initialize new subscription on save
const initializeNewOnSaveSubscription = (
  TranquilAutomations,
  TranquilScript,
  atom
) => {
  const TS = new TranquilScript();
  const onSaveIdeCallback = onSaveIde(
    TranquilAutomations,
    TranquilScript,
    atom,
    TS
  );
  TS.registerCommand(registeredCommands.RUN_AUTOMATIONS, onSaveIdeCallback);
  return TS;
};

const outputLogToTerminal = (logOutput, TranquilAutomations) => {
  const command = 'Write-Output "' + logOutput + '"';
  TranquilAutomations.runInTerminal?.run([command]);
};

const hasDuplicateCommands = (TranquilScript) => {
  const instances = TranquilScript.getAllInstances();
  const commands = instances?.map((instance) => {
    return instance?.getCommand();
  });
  return new Set(commands).size !== commands.length;
};

const executeEditorCode = (TranquilAutomations, atom) => {
  try {
    // save the changes in text editor
    atom.workspace.getCenter().getActivePane().saveActiveItem();
    // Get active editor code
    const editor = atom.workspace.getActiveTextEditor();
    const code = editor?.buffer?.cachedText;
    const output = getEvalOutput(code);
    outputLogToTerminal(output, TranquilAutomations);
  } catch (e) {
    console.log(e);
    outputLogToTerminal(e, TranquilAutomations);
  }
};

const onSaveIde = (TranquilAutomations, TranquilScript, atom, TS) => () => {
  // Clear all subscriptions
  TS.clearAllSubscriptionsExceptCurrent(TS);
  // Execute the code in the editor
  executeEditorCode(TranquilAutomations, atom);
  // Check if there are duplicate commands
  if (hasDuplicateCommands(TranquilScript)) {
    // Clear all subscriptions
    TS.clearAllSubscriptionsExceptCurrent(TS);
    const errorMessage =
      "[ERROR] Command registration failed. Duplicate commands detected. Please rename the duplicate commands.";
    outputLogToTerminal(errorMessage, TranquilAutomations);
  }
};

module.exports = { getEvalOutput, initializeNewOnSaveSubscription };
