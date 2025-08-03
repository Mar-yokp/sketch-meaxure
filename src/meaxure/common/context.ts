// Copyright 2020 Jebbs. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import { sketch } from "../../sketch";
import { ConfigsMaster } from "./config";
import { MeaxureStyles } from "../meaxureStyles";

interface Context {
    document: any;
    selection: any;
    scriptPath: string;
    script?: string;
}

export interface SMContext {
    sketchObject: Context;
    document: Document;
    selection: Selection;
    page: Page;
    artboard: Artboard;
    configs: ConfigsMaster;
    meaxureStyles: MeaxureStyles;
}

export let context: SMContext = undefined;

export function updateContext(ctx?: Context) {
    if (!ctx && !context) throw new Error("Context not initialized");
    let notInitilized = context === undefined;
    // initialized the context
    if (!context && ctx) {
        // logger.debug("initContextRunOnce");
        initContextRunOnce();
    }

    // logger.debug("Update context");
    if (ctx) context.sketchObject = ctx;
    // current document either from ctx or NSDocumentController
    let document = (ctx ? ctx.document : undefined) || NSDocumentController.sharedDocumentController().currentDocument();
    if (notInitilized || document != context.sketchObject.document) {
        // properties updates only when document change
        // logger.debug("Update target document");
        context.sketchObject.document = document;
        context.document = sketch.Document.fromNative(context.sketchObject.document);
        context.configs = new ConfigsMaster(document);
    }
    if (document) {
        // properties always need to update
        context.page = context.document.selectedPage;
        // Get current artboard from selected layers or page layers
        let currentArtboard = null;
        if (context.document.selectedLayers.length > 0) {
            // Try to find artboard from selected layers
            for (let layer of context.document.selectedLayers.layers) {
                if (layer.type === sketch.Types.Artboard) {
                    currentArtboard = layer.sketchObject;
                    break;
                }
                // If layer is inside an artboard, get its parent artboard
                let parent = (layer as any).parent;
                while (parent && parent.type !== sketch.Types.Artboard) {
                    parent = (parent as any).parent;
                }
                if (parent && parent.type === sketch.Types.Artboard) {
                    currentArtboard = parent.sketchObject;
                    break;
                }
            }
        }
        // If no artboard found from selection, get first artboard from current page
        if (!currentArtboard && context.page.layers.length > 0) {
            for (let layer of context.page.layers) {
                if (layer.type === sketch.Types.Artboard) {
                    currentArtboard = layer.sketchObject;
                    break;
                }
            }
        }
        context.artboard = currentArtboard ? sketch.Artboard.fromNative(currentArtboard) : null;
        context.selection = context.document.selectedLayers;
        context.meaxureStyles = new MeaxureStyles(context.document);
    }
    return context;
}

function initContextRunOnce() {
    context = <SMContext>{};
}