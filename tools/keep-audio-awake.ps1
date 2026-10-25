param([Parameter(Mandatory=$true)][int]$BatchPid)
# Prevent automatic system sleep only while this owned audio process exists.
# Does not keep the screen lit, change the power plan, or prevent manual sleep.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PlecAudioPower {
 [DllImport("kernel32.dll", SetLastError=true)]
 public static extern uint SetThreadExecutionState(uint flags);
}
'@
try {
 while(Get-Process -Id $BatchPid -ErrorAction SilentlyContinue) {
  [void][PlecAudioPower]::SetThreadExecutionState([uint32]2147483649)
  Start-Sleep -Seconds 20
 }
} finally { [void][PlecAudioPower]::SetThreadExecutionState([uint32]2147483648) }
