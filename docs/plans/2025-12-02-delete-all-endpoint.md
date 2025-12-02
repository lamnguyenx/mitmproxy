# Delete All Flows Endpoint Implementation Plan

## Overview

Add a "Delete All" endpoint to mitmweb that removes all flows from the view, complementing the existing "Kill All" functionality. This will allow users to clear their flow list completely.

## Current State Analysis

**Existing Flow Management:**
- Individual flow deletion: `DELETE /flows/{flow_id}` (mitmproxy/tools/web/app.py:568)
- Kill all flows: `POST /flows/kill` (kills flows but keeps them in view)
- No "delete all" endpoint exists
- Frontend supports individual flow removal via `remove()` function



**Key Findings:**
- Flow removal is handled by `self.view.remove([self.flow])` in FlowHandler.delete()
- Frontend uses Redux for state management with flows stored in normalized structure

## Desired End State

After implementation:
- `DELETE /flows` endpoint removes all flows from view
- Frontend has "Delete All" button in flow table menu
- Automated tests verify endpoint functionality
- Manual testing confirms UI integration

### Key Deliverables:
- Backend API endpoint for bulk flow deletion
- Frontend UI integration with delete all functionality
- Comprehensive test coverage

## What We're NOT Doing

- Modifying existing individual flow deletion behavior
- Changing the "Kill All" functionality (which kills but doesn't remove flows)
- Altering flow storage or persistence logic
- Adding flow filtering to delete operations

## Implementation Approach

Incremental approach focusing on backend API first, then frontend integration, followed by testing infrastructure.

## Phase 1: Backend API Implementation

### Overview
Add DeleteFlows endpoint to complement existing KillFlows endpoint.

### Changes Required:

#### 1. Add DeleteFlows Handler Class
**File**: `mitmproxy/tools/web/app.py`
**Location**: After KillFlows class (around line 552)
**Changes**:

```python
class DeleteFlows(RequestHandler):
    def delete(self):
        # Remove all flows from view
        flows_to_remove = list(self.view)
        self.view.remove(flows_to_remove)
```

#### 2. Add Route Registration
**File**: `mitmproxy/tools/web/app.py`
**Location**: handlers list (around line 890)
**Changes**: Add after `/flows/kill` route:

```python
(r"/flows", DeleteFlows),
```

### Success Criteria:

#### Automated Verification:
- [ ] `uv run tox -e mypy` passes (type checking)
- [ ] `uv run tox -e lint` passes (linting)
- [ ] Unit tests added for DeleteFlows handler
- [ ] Integration tests verify endpoint removes all flows

#### Manual Verification:
- [ ] API endpoint responds correctly to DELETE /flows
- [ ] All flows are removed from view after deletion
- [ ] No regressions in existing flow operations

## Phase 2: Frontend Integration

### Overview
Add delete all functionality to the web interface.

### Changes Required:

#### 1. Add removeAll Backend Action
**File**: `web/src/js/ducks/flows/_backend_actions.ts`
**Location**: After remove() function (around line 40)
**Changes**:

```typescript
export function removeAll() {
    return () => fetchApi("/flows", { method: "DELETE" });
}
```

#### 2. Add Redux Action and Reducer Support
**File**: `web/src/js/ducks/flows/index.ts`
**Location**: After FLOWS_REMOVE action (around line 28)
**Changes**:

```typescript
export const FLOWS_REMOVE_ALL = createAction("flows/removeAll");
```

**File**: `web/src/js/ducks/flows/index.ts`
**Location**: In flowsReducer, after FLOWS_REMOVE case
**Changes**:

```typescript
} else if (FLOWS_REMOVE_ALL.match(action)) {
    return {
        list: [],
        _listIndex: new Map(),
        byId: new Map(),
        view: [],
        _viewIndex: new Map(),
        sort: state.sort,
        selected: [],
        selectedIds: new Set(),
        highlightedIds: new Set(),
    };
```

#### 3. Add UI Button
**File**: Flow table menu component (need to identify specific file)
**Location**: In flow actions menu
**Changes**: Add "Delete All" button that dispatches removeAll action

### Success Criteria:

#### Automated Verification:
- [ ] `npm run eslint` passes
- [ ] `npm run build` succeeds
- [ ] Frontend unit tests for removeAll action
- [ ] E2E tests for delete all functionality

#### Manual Verification:
- [ ] "Delete All" button appears in flow table menu
- [ ] Clicking button removes all flows from UI
- [ ] Button disabled when no flows present
- [ ] No regressions in individual flow deletion

## Phase 3: Testing Infrastructure

### Overview
Set up comprehensive testing for the new functionality.

### Changes Required:

#### 1. Backend Tests
**File**: `test/mitmproxy/tools/web/` (new test file)
**Changes**: Add tests for DeleteFlows endpoint

#### 2. Frontend Tests
**File**: `web/src/js/ducks/flows/__tests__/` (new test file)
**Changes**: Add tests for removeAll action and reducer

#### 3. Integration Tests
**File**: `test/mitmproxy/tools/web/` (existing or new)
**Changes**: Add end-to-end tests for delete all functionality

### Success Criteria:

#### Automated Verification:
- [ ] All new tests pass
- [ ] Test coverage maintained above 100% for core modules
- [ ] No regressions in existing test suite

#### Manual Verification:
- [ ] Manual testing script successfully posts flows and deletes them
- [ ] UI testing confirms delete all works in browser

## Testing Strategy

### Unit Tests:
- DeleteFlows handler processes delete requests correctly
- Frontend removeAll action calls correct API endpoint
- Redux reducer handles FLOWS_REMOVE_ALL correctly

### Integration Tests:
- End-to-end flow posting and bulk deletion
- WebSocket updates propagate correctly after delete all
- UI state updates properly after bulk deletion
- Use Docker dev environment: Run tests against containerized mitmweb with hotloading to verify functionality during development

### Manual Testing Steps:
1. Start mitmweb using Docker dev setup (`docker-compose up mm`)
2. Post several dummy flows via API
3. Verify flows appear in web interface
4. Use "Delete All" button to remove all flows
5. Confirm flows are removed from both API and UI
6. Test edge cases (no flows, concurrent operations)
7. Iterate quickly: Make code changes, restart `mm` service (`docker-compose restart mm`), re-test without full rebuilds

## Performance Considerations

- Bulk deletion should be efficient for large flow lists
- Frontend state updates should handle large removals gracefully
- API response time should remain under 100ms for typical usage

## Migration Notes

- No database migration needed (flows are in-memory)
- Existing individual deletion functionality unchanged
- Backward compatibility maintained for all existing endpoints

## References

- Current flow deletion: `mitmproxy/tools/web/app.py:568`
- Frontend flow actions: `web/src/js/ducks/flows/_backend_actions.ts`