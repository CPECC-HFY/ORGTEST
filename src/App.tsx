/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Edit, Plus, Trash, ZoomIn, ZoomOut, Maximize, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Employee = {
  id: string;
  name: string;
  position: string;
  parentId: string | null;
};

type TreeNode = Employee & {
  children: TreeNode[];
};

const initialEmployees: Employee[] = [
  { id: '1', name: 'Sarah Connor', position: 'Chief Executive Officer', parentId: null },
  { id: '2', name: 'Marcus Wright', position: 'Chief Operations Officer', parentId: '1' },
  { id: '3', name: 'Kyle Reese', position: 'Chief Technology Officer', parentId: '1' },
  { id: '4', name: 'Derek Reese', position: 'VP of Engineering', parentId: '3' },
  { id: '5', name: 'Allison Young', position: 'Lead Designer', parentId: '3' },
  { id: '6', name: 'John Connor', position: 'Operations Manager', parentId: '2' },
  { id: '7', name: 'Kate Brewster', position: 'HR Director', parentId: '2' },
];

const buildTree = (employees: Employee[], parentId: string | null = null): TreeNode[] => {
  return employees
    .filter(emp => emp.parentId === parentId)
    .map(emp => ({
      ...emp,
      children: buildTree(employees, emp.id)
    }));
};

const OrgNode = ({
  node,
  onEdit,
  onAddChild,
  onDelete
}: {
  node: TreeNode;
  onEdit: (node: TreeNode) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <li>
      <div className="relative group inline-block">
        <div
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 min-w-[200px] cursor-default hover:shadow-md transition-all hover:border-blue-300"
          onMouseDown={(e) => e.stopPropagation()} // Prevent panning when interacting with the card
        >
          <h3 className="font-semibold text-slate-800 text-base">{node.name}</h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">{node.position}</p>
        </div>
        {/* Actions */}
        <div className="absolute -top-4 -right-4 hidden group-hover:flex gap-1 bg-white shadow-md border border-slate-200 rounded-lg p-1 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
            title="Add Subordinate"
          >
            <Plus size={16} />
          </button>
          {node.parentId && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
              title="Delete"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map(child => (
            <OrgNode
              key={child.id}
              node={child}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    nodeId?: string;
    parentId?: string;
    name: string;
    position: string;
  }>({
    isOpen: false,
    mode: 'add',
    name: '',
    position: ''
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const rootNodes = useMemo(() => buildTree(employees, null), [employees]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalState.mode === 'add') {
      const newNode: Employee = {
        id: Math.random().toString(36).substr(2, 9),
        name: modalState.name,
        position: modalState.position,
        parentId: modalState.parentId || null
      };
      setEmployees([...employees, newNode]);
    } else {
      setEmployees(employees.map(emp =>
        emp.id === modalState.nodeId
          ? { ...emp, name: modalState.name, position: modalState.position }
          : emp
      ));
    }
    setModalState({ ...modalState, isOpen: false });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const idsToDelete = new Set<string>();
    const collectIds = (nodeId: string) => {
      idsToDelete.add(nodeId);
      employees.filter(e => e.parentId === nodeId).forEach(e => collectIds(e.id));
    };
    collectIds(confirmDelete);
    setEmployees(employees.filter(e => !idsToDelete.has(e.id)));
    setConfirmDelete(null);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Users size={18} />
          </div>
          <h1 className="text-lg font-semibold">Organization Chart</h1>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'add', parentId: undefined, name: '', position: '' })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Add Root Node
        </button>
      </header>

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden bg-slate-50/50 relative cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <div className="org-tree">
            <ul>
              {rootNodes.map(node => (
                <OrgNode
                  key={node.id}
                  node={node}
                  onEdit={(n) => setModalState({ isOpen: true, mode: 'edit', nodeId: n.id, name: n.name, position: n.position })}
                  onAddChild={(parentId) => setModalState({ isOpen: true, mode: 'add', parentId, name: '', position: '' })}
                  onDelete={(id) => setConfirmDelete(id)}
                />
              ))}
            </ul>
          </div>
        </div>

        {/* Toolbar */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white p-2 rounded-xl shadow-lg border border-slate-200 z-10">
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ZoomOut size={20} />
          </button>
          <span className="text-sm font-medium text-slate-600 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ZoomIn size={20} />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Reset View">
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  {modalState.mode === 'add' ? 'Add Node' : 'Edit Node'}
                </h2>
                <button
                  onClick={() => setModalState({ ...modalState, isOpen: false })}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={modalState.name}
                      onChange={(e) => setModalState({ ...modalState, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                    <input
                      type="text"
                      required
                      value={modalState.position}
                      onChange={(e) => setModalState({ ...modalState, position: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalState({ ...modalState, isOpen: false })}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 p-6"
            >
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Delete Node?</h2>
              <p className="text-slate-600 text-sm mb-6">
                Are you sure you want to delete this node? All subordinate nodes will also be deleted. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
