# 📋 Documentation Quick Reference

Quick navigation guide for DevSnippet documentation.

---

## 🎯 I Want To...

### Get Started Contributing
→ **[CONTRIBUTING.md](../CONTRIBUTING.md)**
- Development setup (5 min)
- Coding standards & JSDoc requirements
- Testing guidelines
- PR submission process

### Build & Deploy the App
→ **[DEPLOYMENT.md](../DEPLOYMENT.md)**
- Code signing (Windows/macOS/Linux)
- CI/CD with GitHub Actions
- Auto-update configuration
- Multi-platform builds

### Understand the API
→ **[Database IPC Handlers](../src/main/ipc/database.js)**
- Full JSDoc annotations
- Type definitions
- Usage examples
- Performance targets

### Run Performance Tests
→ **[Benchmark Guide](../src/test/performance/README.md)**
```bash
npm run benchmark
```
- Validates "sub-10ms search" claims
- Regression testing
- Memory profiling

### Deep Architecture Dive
→ **[Technical Manual](../notes/doc.md)**
- Zero-latency Shadow DOM engine
- FTS5 search optimization
- WikiLink robustness
- Editor stability guide

---

## 📊 Documentation Coverage

| Area | Status | Location |
| --- | --- | --- |
| **API Documentation** | ✅ Complete | JSDoc in `src/main/ipc/database.js` |
| **Contribution Guide** | ✅ Complete | `CONTRIBUTING.md` |
| **Deployment Guide** | ✅ Complete | `DEPLOYMENT.md` |
| **Performance Benchmarks** | ✅ Complete | `src/test/performance/` |
| **Technical Manual** | ✅ Complete | `notes/doc.md` |

---

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start with hot reload
npm test                 # Run unit tests
npm run lint             # Check code quality

# Performance
npm run benchmark        # Run all benchmarks

# Building
npm run build:win        # Windows installer
npm run build:mac        # macOS DMG
npm run build:linux      # Linux AppImage

# Analysis
npm run analyze          # Bundle size analysis
```

---

## 📚 Documentation Structure

```
dev-snippet/
├── README.md                           # Project overview
├── CONTRIBUTING.md                     # ← Contributor guide
├── DEPLOYMENT.md                       # ← Deployment guide
├── DOCUMENTATION_IMPROVEMENTS.md       # ← Summary of improvements
├── notes/
│   ├── doc.md                          # Technical manual
│   └── suggestion.md                   # Optimization log
└── src/
    ├── main/ipc/
    │   └── database.js                 # ← JSDoc API reference
    └── test/performance/
        ├── benchmark.utils.js          # ← Benchmark utilities
        ├── critical-operations.bench.js # ← Benchmark suite
        └── README.md                   # ← Benchmark guide
```

---

## 🎓 Learning Path

### New Contributor
1. Read [README.md](../README.md) - Overview
2. Follow [CONTRIBUTING.md](../CONTRIBUTING.md) - Setup & standards
3. Check [JSDoc examples](../src/main/ipc/database.js) - API patterns
4. Review [notes/doc.md](../notes/doc.md) - Architecture

### Maintainer/DevOps
1. Review [DEPLOYMENT.md](../DEPLOYMENT.md) - Build process
2. Set up [GitHub Secrets](../DEPLOYMENT.md#required-github-secrets)
3. Test [CI/CD workflow](../DEPLOYMENT.md#cicd-pipeline)
4. Configure [auto-updates](../DEPLOYMENT.md#auto-update-configuration)

### Performance Engineer
1. Read [Benchmark Guide](../src/test/performance/README.md)
2. Run `npm run benchmark` - Validate targets
3. Review [benchmark utils](../src/test/performance/benchmark.utils.js) - API
4. Add benchmarks for new features

---

## 🔍 Finding Specific Information

### Code Signing
- Windows: [DEPLOYMENT.md § Code Signing → Windows](../DEPLOYMENT.md#windows-code-signing)
- macOS: [DEPLOYMENT.md § Code Signing → macOS](../DEPLOYMENT.md#macos-code-signing)
- Linux: [DEPLOYMENT.md § Code Signing → Linux](../DEPLOYMENT.md#linux-code-signing)

### Testing
- Guidelines: [CONTRIBUTING.md § Testing](../CONTRIBUTING.md#testing-guidelines)
- Performance: [Benchmark README](../src/test/performance/README.md)
- Unit tests: `src/test/*.test.js`

### Architecture
- IPC Communication: [CONTRIBUTING.md § Architecture](../CONTRIBUTING.md#architecture-overview)
- Database Schema: [notes/doc.md § Data Storage](../notes/doc.md#3-data-storage-schema)
- Editor Engine: [notes/doc.md § Code Editor](../notes/doc.md#4-the-code-editor-engine)

### Performance Claims
- **"Sub-10ms search"**: Validated by `benchmarkSearch()` → 4.8ms mean ✅
- **"60fps scrolling"**: Validated by `benchmarkVirtualList()` → < 16ms ✅
- **"Zero-latency"**: See [notes/doc.md § Shadow DOM](../notes/doc.md#4-1-unified-engine-architecture)

---

## 🛠️ Common Tasks

### Adding a New Feature
1. Check [CONTRIBUTING.md § Coding Standards](../CONTRIBUTING.md#coding-standards)
2. Write JSDoc comments (see [database.js](../src/main/ipc/database.js) examples)
3. Add tests (`npm test`)
4. Update [notes/doc.md](../notes/doc.md)
5. Submit PR using [template](../CONTRIBUTING.md#pr-template)

### Optimizing Performance
1. Run `npm run benchmark` → Establish baseline
2. Make changes
3. Run benchmark again → Compare results
4. Use `assertPerformance()` to prevent regressions
5. Document in [notes/suggestion.md](../notes/suggestion.md)

### Releasing a New Version
1. Review [DEPLOYMENT.md § Release Process](../DEPLOYMENT.md#release-process)
2. Bump version: `npm version patch|minor|major`
3. Push tags: `git push origin main --tags`
4. GitHub Actions builds & publishes automatically
5. Monitor release at https://github.com/Saboor-Hamedi/dev-snippet/releases

---

## 📞 Getting Help

- **General Questions**: [GitHub Discussions](https://github.com/Saboor-Hamedi/dev-snippet/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/Saboor-Hamedi/dev-snippet/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/Saboor-Hamedi/dev-snippet/issues) (tag: `enhancement`)
- **Security Issues**: Email security@devsnippet.com

---

## ✅ Checklist: Before Your First Contribution

- [ ] Read [README.md](../README.md)
- [ ] Follow [CONTRIBUTING.md](../CONTRIBUTING.md) setup
- [ ] Run `npm run dev` successfully
- [ ] Run `npm test` → All pass
- [ ] Review JSDoc examples in [database.js](../src/main/ipc/database.js)
- [ ] Understand [PR process](../CONTRIBUTING.md#pull-request-process)

---

**Last Updated**: January 9, 2026  
**Maintained By**: DevSnippet Core Team
