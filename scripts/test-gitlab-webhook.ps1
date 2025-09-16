$ErrorActionPreference = "Stop"

param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$InstanceId = "YOUR_INSTANCE_ID",
  [string]$Token = "YOUR_WEBHOOK_SECRET"
)

function Invoke-GitLabWebhook {
  param(
    [string]$EventType,
    [hashtable]$Body
  )

  $uri = "$BaseUrl/gitlab/webhook?instanceId=$InstanceId"
  Write-Host "POST $uri ($EventType)"
  $headers = @{
    "X-Gitlab-Event" = $EventType
    "X-Gitlab-Token" = $Token
    "Content-Type"   = "application/json"
  }

  $json = ($Body | ConvertTo-Json -Depth 20)
  try {
    $res = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $json
    Write-Host "Response:" ($res | ConvertTo-Json -Depth 5)
  }
  catch {
    Write-Error $_
  }
}

# 示例：push 事件
$push = @{
  object_kind = "push"
  event_type  = "push"
  user = @{ id = 1; username = "john"; name = "John"; email = "john@example.com" }
  project = @{ id = 100; name = "demo"; path_with_namespace = "group/demo"; web_url = "https://gitlab.example.com/group/demo" }
  repository = @{ name = "demo"; url = "git@example.com:group/demo.git"; homepage = "https://gitlab.example.com/group/demo" }
  ref = "refs/heads/main"
  before = "0000000000000000000000000000000000000000"
  after  = "1111111111111111111111111111111111111111"
  commits = @()
  created_at = (Get-Date).ToString("o")
  updated_at = (Get-Date).ToString("o")
}
Invoke-GitLabWebhook -EventType "Push Hook" -Body $push

# 示例：issue 事件
$issue = @{
  object_kind = "issue"
  event_type  = "issue"
  user = @{ id = 1; username = "john"; name = "John"; email = "john@example.com" }
  project = @{ id = 100; name = "demo"; path_with_namespace = "group/demo"; web_url = "https://gitlab.example.com/group/demo" }
  repository = @{ name = "demo"; url = "git@example.com:group/demo.git"; homepage = "https://gitlab.example.com/group/demo" }
  object_attributes = @{ id = 10; iid = 10; title = "Sample"; state = "opened"; action = "open"; created_at = (Get-Date).ToString("o"); updated_at = (Get-Date).ToString("o") }
  created_at = (Get-Date).ToString("o")
  updated_at = (Get-Date).ToString("o")
}
Invoke-GitLabWebhook -EventType "Issue Hook" -Body $issue

# 示例：tag_push 事件
$tagpush = @{
  object_kind = "tag_push"
  event_type  = "tag_push"
  user = @{ id = 1; username = "john"; name = "John"; email = "john@example.com" }
  project = @{ id = 100; name = "demo"; path_with_namespace = "group/demo"; web_url = "https://gitlab.example.com/group/demo" }
  repository = @{ name = "demo"; url = "git@example.com:group/demo.git"; homepage = "https://gitlab.example.com/group/demo" }
  ref = "refs/tags/v1.0.0"
  before = "0000000000000000000000000000000000000000"
  after  = "2222222222222222222222222222222222222222"
  created_at = (Get-Date).ToString("o")
  updated_at = (Get-Date).ToString("o")
}
Invoke-GitLabWebhook -EventType "Tag Push Hook" -Body $tagpush

# 示例：merge_request 事件
$mr = @{
  object_kind = "merge_request"
  event_type  = "merge_request"
  user = @{ id = 1; username = "john"; name = "John"; email = "john@example.com" }
  project = @{ id = 100; name = "demo"; path_with_namespace = "group/demo"; web_url = "https://gitlab.example.com/group/demo" }
  repository = @{ name = "demo"; url = "git@example.com:group/demo.git"; homepage = "https://gitlab.example.com/group/demo" }
  object_attributes = @{ id = 200; iid = 5; title = "MR title"; description = "desc"; state = "opened"; source_branch = "feat"; target_branch = "main"; author_id = 1; created_at = (Get-Date).ToString("o"); updated_at = (Get-Date).ToString("o") }
  created_at = (Get-Date).ToString("o")
  updated_at = (Get-Date).ToString("o")
}
Invoke-GitLabWebhook -EventType "Merge Request Hook" -Body $mr

# 示例：pipeline 事件
$pipeline = @{
  object_kind = "pipeline"
  event_type  = "pipeline"
  user = @{ id = 1; username = "john"; name = "John"; email = "john@example.com" }
  project = @{ id = 100; name = "demo"; path_with_namespace = "group/demo"; web_url = "https://gitlab.example.com/group/demo" }
  repository = @{ name = "demo"; url = "git@example.com:group/demo.git"; homepage = "https://gitlab.example.com/group/demo" }
  object_attributes = @{ id = 300; status = "success"; ref = "main"; sha = "1111111111111111111111111111111111111111"; created_at = (Get-Date).ToString("o"); finished_at = (Get-Date).ToString("o") }
  created_at = (Get-Date).ToString("o")
  updated_at = (Get-Date).ToString("o")
}
Invoke-GitLabWebhook -EventType "Pipeline Hook" -Body $pipeline

Write-Host "Done."


