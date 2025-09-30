const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  mType: {
    type: String
  },
  eventId: {
    type: String,
    required: true,
    // index: true
  },
  marketId: {
    type: String,
    required: true,
    index: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  competitionName: {
    type: String,
    trim: true,
    default: ''
  },
  sportId: {
    type: Number,
    required: true
  },
  sportName: {
    type: String,
    trim: true
  },
  openDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    trim: true,
    // default: 'auto'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isResult: {
    type: Boolean,
    default: false
  },
  scoreId: {
    type: String,
    default: '0'
  },
  scoreId2: {
    type: String,
    default: '0'
  },
  scoreType: {
    type: String,
    trim: true,
    default: ''
  },
  tvUrl: {
    type: String,
    trim: true,
    validate: {
      validator: v => !v || /^https?:\/\//.test(v),
      message: props => `${props.value} is not a valid URL`
    },
    default: ''
  },
  matchRuners: [
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      selectionId: {
        type: Number,
        required: true,
        index: true
      }
    }
  ],
  matchType: {
    type: String,
    trim: true,
    default: 'All'
  },
  match_ka_type: {
    type: String,
    trim: true,
    default: ''
  },
  marketIds: {
    type: [String],
    default: []
  },
  competitionId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound unique index: ek eventId + marketId ek hi baar save hoga
// MatchSchema.index({ eventId: 1, marketId: 1 }, { unique: true });
MatchSchema.index({ eventId: 1 }, { unique: true });

// Text index for fast search
MatchSchema.index({ eventName: 'text', competitionName: 'text' });

const Match = mongoose.model('Match', MatchSchema);
module.exports = Match;
