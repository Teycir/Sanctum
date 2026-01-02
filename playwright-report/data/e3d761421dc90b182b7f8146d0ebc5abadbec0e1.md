# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - button "←" [ref=e4] [cursor=pointer]
    - heading "Unlock Vault" [level=1] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: ⚠️ Limited connectivity (2 peers) - unlock may be slow
      - textbox "Enter password to unlock..." [ref=e9]: StrongPass123!
      - generic [ref=e10]: "Failed to unlock vault: IPFS download timeout after 60 seconds"
      - button "Unlock" [ref=e12] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e18] [cursor=pointer]:
    - img [ref=e19]
  - alert [ref=e22]
```