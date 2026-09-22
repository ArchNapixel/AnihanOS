# Graph Report - AnihanOS  (2026-09-22)

## Corpus Check
- Corpus is ~31,754 words - fits in a single context window. You may not need a graph.

## Summary
- 579 nodes · 1375 edges · 32 communities (19 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 58,418 input · 0 output

## Community Hubs (Navigation)
- Fertilizing Schedule & Growth Stages
- Farm & Module Management
- Plot Map & GeoJSON
- Client Dependencies
- Server API & Routing
- Crop Cycle Financials
- Aquaculture Records
- Server Dependencies
- Input Stock Management
- Weather & Weed Risk
- Livestock Groups
- Harvest Records
- Sugarcane Forecast Engine
- Client TS Config
- Server TS Config
- Project Rules & Entry Point
- Root Package Scripts
- Node TS Config
- Vercel Config
- Database Types
- Vite Env Types
- Rule: Build Before Handoff
- Rule: Ask First On Ambiguous Decisions
- Rule: Dead Code Cleanup
- Rule: Wait For Go-Ahead
- Rule: Flag Inconsistent Docs
- Rule: Hide vs Delete
- Rule: Label UI Assumptions
- Rule: No Fabricated Precision
- Rule: No Auto-Commit
- Rule: Terse UI Copy

## God Nodes (most connected - your core abstractions)
1. `react` - 40 edges
2. `getOrCreateDefaultFarm()` - 24 edges
3. `todayIso()` - 24 edges
4. `supabase` - 21 edges
5. `Plot` - 19 edges
6. `compilerOptions` - 18 edges
7. `DashboardPage()` - 17 edges
8. `listPlots()` - 17 edges
9. `CropsPage()` - 16 edges
10. `CropCycle` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Default To Backend-Only Changes` --conceptually_related_to--> `client/ — React + TypeScript + Vite Frontend`  [AMBIGUOUS]
  CLAUDE.md → README.md
- `Never Execute Writes/DDL Directly Against Supabase` --conceptually_related_to--> `Manual Supabase Schema Change Workflow`  [INFERRED]
  CLAUDE.md → README.md
- `Never Create Migration Files` --conceptually_related_to--> `supabase/migrations/ — SQL Migrations (Schema Source of Truth)`  [INFERRED]
  CLAUDE.md → README.md
- `Present Full Schema Proposal In One Message` --conceptually_related_to--> `Manual Supabase Schema Change Workflow`  [INFERRED]
  CLAUDE.md → README.md
- `Default To Backend-Only Changes` --conceptually_related_to--> `server/ — Express + TypeScript Backend`  [INFERRED]
  CLAUDE.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Supabase Schema Change Workflow (Rules + Structure)** — claude_md_supabase_write_restriction, claude_md_migration_file_restriction, claude_md_schema_proposal_single_message, readme_supabase_migrations, readme_database_workflow, readme_type_regeneration [INFERRED 0.85]
- **Code Workflow Rules (CLAUDE.md)** — claude_md_build_before_handoff, claude_md_explicit_go_ahead, claude_md_no_git_commit_without_ask, claude_md_delete_dead_code, claude_md_default_backend_only [INFERRED 0.85]
- **Modeling/Accuracy Rules (CLAUDE.md)** — claude_md_no_fabricated_precision, claude_md_label_assumptions_in_ui, claude_md_flag_inconsistent_reference_docs [INFERRED 0.85]

## Communities (32 total, 13 thin omitted)

### Community 0 - "Fertilizing Schedule & Growth Stages"
Cohesion: 0.08
Nodes (49): PlotCycleHistoryModal(), emptyFertilizingRow(), FertilizingStageRow, fertilizingStagesToRows(), parseFertilizingStages(), GrowthStage, CropCycleFormModal(), CropTypeAction (+41 more)

### Community 1 - "Farm & Module Management"
Cohesion: 0.09
Nodes (33): DEFAULT_SUGARCANE_CROP_TYPE, Farm, FarmModule, updateFarmLocation(), updateFarmModules(), PlotFeatureProperties, App(), AppLayout() (+25 more)

### Community 2 - "Plot Map & GeoJSON"
Cohesion: 0.07
Nodes (42): fetchFarmPlotsGeoJson(), PlotFeatureCollection, AllPlotsMap, AllPlotsMapHandle, AllPlotsMapProps, buildCropPopupEntryHtml(), buildCropPopupHtml(), escapeHtml() (+34 more)

### Community 3 - "Client Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, leaflet, leaflet-draw, lucide-react, react (+32 more)

### Community 4 - "Server API & Routing"
Cohesion: 0.10
Nodes (23): express, ref_supabase_supabase_js, app, placeholder(), plotsGeoJson(), sync(), supabaseAdmin, createUserScopedClient() (+15 more)

### Community 5 - "Crop Cycle Financials"
Cohesion: 0.12
Nodes (30): recordCropCycleSale(), updateCropCycleYield(), CsvPreviewModal(), buildFinancialsCsvRows(), buildFinancialsCsvText(), CropCycleFinancials, CSV_HEADERS, csvEscape() (+22 more)

### Community 6 - "Aquaculture Records"
Cohesion: 0.13
Nodes (27): AquaculturePage(), PRODUCTION_SYSTEM_LABELS, AquacultureRecordFormModal(), RECORD_TYPES, AquacultureRecordHistoryModal(), load(), formatDetails(), RECORD_TYPE_LABELS (+19 more)

### Community 7 - "Server Dependencies"
Cohesion: 0.06
Nodes (29): cors, dotenv, tsx, @types/cors, @types/express, @types/node, ref_url, dependencies (+21 more)

### Community 8 - "Input Stock Management"
Cohesion: 0.16
Nodes (23): AddStockModal(), InputsPage(), addStockQuantity(), createInputStock(), deleteInputStock(), InputStock, InputStockInput, InputType (+15 more)

### Community 9 - "Weather & Weed Risk"
Cohesion: 0.17
Nodes (23): getOrCreateDefaultFarm(), seedDefaultCropTypes(), listWeatherForFarm(), WeatherDaily, computeWeedRisk(), WeedRiskLevel, listCropCycles(), listActivitiesForFarm() (+15 more)

### Community 10 - "Livestock Groups"
Cohesion: 0.17
Nodes (20): LivestockGroupFormModal(), createLivestockGroup(), deleteLivestockGroup(), LivestockGroup, LivestockGroupInput, updateLivestockGroup(), LivestockPage(), RECORD_TYPES (+12 more)

### Community 11 - "Harvest Records"
Cohesion: 0.18
Nodes (19): HarvestRecordFormModal(), HarvestRecordHistoryModal(), load(), createHarvestRecord(), HarvestRecord, HarvestRecordInput, listHarvestRecordsForPlanting(), CROP_SUGGESTIONS (+11 more)

### Community 12 - "Sugarcane Forecast Engine"
Cohesion: 0.15
Nodes (22): averageDailyRainfall(), averageTemp(), computeFertilizerFactor(), daysBetween(), FertilizerApplication, FertilizerForecast, forecastSugarcane(), getSugarcaneStage() (+14 more)

### Community 13 - "Client TS Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+13 more)

### Community 14 - "Server TS Config"
Cohesion: 0.12
Nodes (15): compilerOptions, baseUrl, esModuleInterop, lib, module, moduleResolution, outDir, paths (+7 more)

### Community 15 - "Project Rules & Entry Point"
Cohesion: 0.19
Nodes (14): Default To Backend-Only Changes, Never Create Migration Files, Present Full Schema Proposal In One Message, Never Execute Writes/DDL Directly Against Supabase, client/index.html Entry Document, #root Mount Element, src/main.tsx Entry Script, AnihanOS (Farm Management & Inventory Platform) (+6 more)

### Community 16 - "Root Package Scripts"
Cohesion: 0.17
Nodes (11): devDependencies, concurrently, name, private, scripts, dev, dev:client, dev:server (+3 more)

### Community 17 - "Node TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 18 - "Vercel Config"
Cohesion: 0.40
Nodes (4): builds, crons, routes, version

## Ambiguous Edges - Review These
- `Default To Backend-Only Changes` → `client/ — React + TypeScript + Vite Frontend`  [AMBIGUOUS]
  CLAUDE.md · relation: conceptually_related_to

## Knowledge Gaps
- **171 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+166 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 181 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Default To Backend-Only Changes` and `client/ — React + TypeScript + Vite Frontend`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `Farm & Module Management` to `Fertilizing Schedule & Growth Stages`, `Plot Map & GeoJSON`, `Client Dependencies`, `Crop Cycle Financials`, `Aquaculture Records`, `Input Stock Management`, `Weather & Weed Risk`, `Livestock Groups`, `Harvest Records`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `express` connect `Server API & Routing` to `Server Dependencies`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Fertilizing Schedule & Growth Stages` be split into smaller, more focused modules?**
  _Cohesion score 0.08294930875576037 - nodes in this community are weakly interconnected._
- **Should `Farm & Module Management` be split into smaller, more focused modules?**
  _Cohesion score 0.0942684766214178 - nodes in this community are weakly interconnected._
- **Should `Plot Map & GeoJSON` be split into smaller, more focused modules?**
  _Cohesion score 0.07372549019607844 - nodes in this community are weakly interconnected._